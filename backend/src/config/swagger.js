const swaggerJsdoc = require('swagger-jsdoc');
const config = require('../config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PNMC Management System API',
      version: '1.0.0',
      description: 'Nursing & Midwifery Council Management System REST API',
      contact: { name: 'PNMC Support', email: 'support@pnmc.gov.pk' },
    },
    servers: [
      { url: `http://localhost:${config.port}/api/v1`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
          },
        },
        Institution: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            institutionType: { type: 'string' },
            status: { type: 'string' },
            registrationNumber: { type: 'string' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            registrationNumber: { type: 'string' },
            personalInfo: { type: 'object' },
            programInfo: { type: 'object' },
            status: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'User login',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/institutions': {
        get: {
          tags: ['Institutions'],
          summary: 'List institutions',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of institutions' } },
        },
        post: {
          tags: ['Institutions'],
          summary: 'Create institution',
          responses: { 201: { description: 'Institution created' } },
        },
      },
      '/students': {
        get: {
          tags: ['Students'],
          summary: 'List students',
          responses: { 200: { description: 'List of students' } },
        },
        post: {
          tags: ['Students'],
          summary: 'Register student',
          responses: { 201: { description: 'Student created' } },
        },
      },
      '/attendance/students': {
        post: {
          tags: ['Attendance'],
          summary: 'Mark student attendance',
          responses: { 200: { description: 'Attendance recorded' } },
        },
      },
      '/payments': {
        post: {
          tags: ['Payments'],
          summary: 'Create payment',
          responses: { 201: { description: 'Payment initiated' } },
        },
      },
      '/biometric/devices/{deviceId}/events': {
        post: {
          tags: ['Biometric'],
          summary: 'Receive real-time biometric event',
          security: [],
          parameters: [
            { name: 'deviceId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Event processed' } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
