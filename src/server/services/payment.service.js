const Stripe = require('stripe');
const crypto = require('crypto');
const config = require('../config');
const { Payment } = require('../models');
const { generateInvoiceNumber } = require('../utils/generators');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class PaymentGateway {
  async initiate(payment) {
    throw new Error('initiate() must be implemented');
  }
  async verify(transactionId, data) {
    throw new Error('verify() must be implemented');
  }
}

class BypassGateway extends PaymentGateway {
  async initiate(payment) {
    return {
      checkoutUrl: `${config.frontendUrl}/payments/success?invoice=${payment.invoiceNumber}&bypass=true`,
      transactionId: `BYPASS-${payment.invoiceNumber}`,
      bypassed: true,
    };
  }

  async verify() {
    return true;
  }
}

class StripeGateway extends PaymentGateway {
  constructor() {
    super();
    this.stripe = config.payment.stripe.secretKey
      ? new Stripe(config.payment.stripe.secretKey)
      : null;
  }

  async initiate(payment) {
    if (!this.stripe) throw new ApiError(503, 'Stripe not configured');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: payment.currency.toLowerCase(),
          product_data: { name: payment.paymentType.replace(/_/g, ' ') },
          unit_amount: Math.round(payment.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${config.frontendUrl}/payments/success?invoice=${payment.invoiceNumber}`,
      cancel_url: `${config.frontendUrl}/payments/cancel?invoice=${payment.invoiceNumber}`,
      metadata: { invoiceNumber: payment.invoiceNumber },
    });

    return { checkoutUrl: session.url, transactionId: session.id };
  }

  async verify(transactionId) {
    const session = await this.stripe.checkout.sessions.retrieve(transactionId);
    return session.payment_status === 'paid';
  }
}

class EasypaisaGateway extends PaymentGateway {
  async initiate(payment) {
    const { merchantId, storeId, hashKey } = config.payment.easypaisa;
    if (!merchantId) throw new ApiError(503, 'Easypaisa not configured');

    const orderId = payment.invoiceNumber;
    const amount = payment.amount.toFixed(2);
    const hashString = `${merchantId}${storeId}${orderId}${amount}${hashKey}`;
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');

    return {
      checkoutUrl: 'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
      transactionId: orderId,
      formData: { merchantId, storeId, orderId, amount, hash },
    };
  }

  async verify(transactionId, data) {
    return data?.status === 'success';
  }
}

class JazzCashGateway extends PaymentGateway {
  async initiate(payment) {
    const { merchantId, password, integritySalt } = config.payment.jazzcash;
    if (!merchantId) throw new ApiError(503, 'JazzCash not configured');

    const pp_TxnRefNo = payment.invoiceNumber;
    const pp_Amount = (payment.amount * 100).toFixed(0);
    const pp_TxnDateTime = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

    const hashString = `${integritySalt}&${pp_Amount}&${pp_TxnDateTime}&${merchantId}&${password}&${pp_TxnRefNo}`;
    const pp_SecureHash = crypto.createHmac('sha256', integritySalt).update(hashString).digest('hex');

    return {
      checkoutUrl: 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform',
      transactionId: pp_TxnRefNo,
      formData: { pp_TxnRefNo, pp_Amount, pp_TxnDateTime, pp_MerchantID: merchantId, pp_SecureHash },
    };
  }

  async verify(transactionId, data) {
    return data?.pp_ResponseCode === '000';
  }
}

class PaymentService {
  constructor() {
    this.gateways = {
      bypass: new BypassGateway(),
      stripe: new StripeGateway(),
      easypaisa: new EasypaisaGateway(),
      jazzcash: new JazzCashGateway(),
    };
  }

  isEnabled() {
    return config.payment.enabled;
  }

  getConfig() {
    return {
      enabled: this.isEnabled(),
      mode: this.isEnabled() ? 'live' : 'bypass',
      message: this.isEnabled()
        ? 'Payment gateways are enabled. Real charges apply.'
        : 'Payment gateways are disabled. All payments auto-complete without charging.',
      availableGateways: this.isEnabled()
        ? ['stripe', 'easypaisa', 'jazzcash'].filter((g) => this.isGatewayConfigured(g))
        : ['bypass'],
    };
  }

  isGatewayConfigured(gateway) {
    if (gateway === 'stripe') return Boolean(config.payment.stripe.secretKey);
    if (gateway === 'easypaisa') return Boolean(config.payment.easypaisa.merchantId);
    if (gateway === 'jazzcash') return Boolean(config.payment.jazzcash.merchantId);
    return false;
  }

  async completePayment(payment, gatewayData = { bypass: true }) {
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.receiptNumber = `RCP-${payment.invoiceNumber}`;
    payment.gatewayResponse = gatewayData;
    await payment.save();
    return payment;
  }

  async createBypassPayment({ paymentType, amount, currency, payer, institution, relatedEntity }) {
    const payment = await Payment.create({
      invoiceNumber: generateInvoiceNumber(),
      paymentType,
      gateway: 'bypass',
      amount,
      currency: currency || 'PKR',
      payer,
      institution,
      relatedEntity,
      status: 'pending',
      metadata: { bypassed: true, reason: 'PAYMENTS_ENABLED=false' },
    });

    const result = await this.gateways.bypass.initiate(payment);
    payment.gatewayTransactionId = result.transactionId;
    await this.completePayment(payment, { bypass: true, mode: 'auto_pass' });

    logger.info(`Payment bypassed (auto-pass): ${payment.invoiceNumber}`);
    return { payment, ...result, bypassed: true };
  }

  async createPayment({ paymentType, gateway, amount, currency, payer, institution, relatedEntity }) {
    if (!this.isEnabled()) {
      return this.createBypassPayment({
        paymentType, amount, currency, payer, institution, relatedEntity,
      });
    }

    if (!gateway || gateway === 'bypass') {
      throw new ApiError(400, 'A payment gateway is required when PAYMENTS_ENABLED=true');
    }

    if (!this.isGatewayConfigured(gateway)) {
      throw new ApiError(503, `${gateway} is not configured. Check environment variables.`);
    }

    const payment = await Payment.create({
      invoiceNumber: generateInvoiceNumber(),
      paymentType,
      gateway,
      amount,
      currency: currency || 'PKR',
      payer,
      institution,
      relatedEntity,
      status: 'pending',
    });

    const gatewayInstance = this.gateways[gateway];
    if (!gatewayInstance) throw new ApiError(400, 'Invalid payment gateway');

    const result = await gatewayInstance.initiate(payment);
    payment.gatewayTransactionId = result.transactionId;
    payment.status = 'processing';
    await payment.save();

    return { payment, ...result };
  }

  async verifyPayment(invoiceNumber, gatewayData = {}) {
    const payment = await Payment.findOne({ invoiceNumber });
    if (!payment) throw new ApiError(404, 'Payment not found');

    if (payment.status === 'completed') {
      return payment;
    }

    if (!this.isEnabled() || payment.gateway === 'bypass') {
      await this.completePayment(payment, { ...gatewayData, bypass: true, mode: 'auto_pass' });
      logger.info(`Payment verify bypassed (auto-pass): ${invoiceNumber}`);
      return payment;
    }

    const gateway = this.gateways[payment.gateway];
    const verified = await gateway.verify(payment.gatewayTransactionId, gatewayData);

    if (verified) {
      await this.completePayment(payment, gatewayData);
    } else {
      payment.status = 'failed';
      payment.gatewayResponse = gatewayData;
      await payment.save();
    }

    return payment;
  }

  async getPaymentHistory(filters, pagination) {
    const { paginate, paginatedResponse } = require('../utils/pagination');
    const query = Payment.find(filters).populate('payer', 'firstName lastName email');
    const total = await Payment.countDocuments(filters);
    const { query: paginatedQuery, pagination: pag } = paginate(query, pagination);
    const data = await paginatedQuery;
    return paginatedResponse(data, total, pag);
  }
}

module.exports = new PaymentService();
