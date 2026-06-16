# RBAC Permissions Matrix

## Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access |
| `council_member` | Final approval authority |
| `committee_member` | Committee review and voting |
| `field_officer` | Institution field inspections |
| `institution_admin` | Institution management |
| `principal` | Institution academic oversight |
| `faculty` | Faculty self-service |
| `student` | Student self-service |
| `finance_officer` | Payment verification |
| `monitoring_officer` | Live monitoring & biometric |

## Permission Matrix

| Permission | Super Admin | Council | Committee | Field Officer | Inst. Admin | Principal | Faculty | Student | Finance | Monitoring |
|------------|:-----------:|:-------:|:---------:|:-------------:|:-----------:|:---------:|:-------:|:-------:|:-------:|:----------:|
| users:read | ✓ | | | | | | | | | |
| users:create | ✓ | | | | | | | | | |
| institutions:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| institutions:create | ✓ | | | | ✓ | | | | | |
| institutions:approve | ✓ | ✓ | | | | | | | | |
| institutions:suspend | ✓ | ✓ | | | | | | | | |
| affidavits:create | ✓ | | | | ✓ | | | | | |
| affidavits:verify | ✓ | | ✓ | | | | | | | |
| affidavits:approve | ✓ | ✓ | | | | | | | | |
| inspections:read | ✓ | ✓ | ✓ | ✓ | | | | | | |
| inspections:create | ✓ | | | ✓ | | | | | | |
| inspections:submit | ✓ | | | ✓ | | | | | | |
| committees:vote | ✓ | | ✓ | | | | | | | |
| committees:review | ✓ | | ✓ | | | | | | | |
| council:approve | ✓ | ✓ | | | | | | | | |
| council:resolution | ✓ | ✓ | | | | | | | | |
| students:read | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | | |
| students:create | ✓ | | | | ✓ | ✓ | | | | |
| students:approve | ✓ | ✓ | ✓ | | | | | | | |
| students:renew | ✓ | | | | ✓ | | ✓ | ✓ | | |
| faculty:read | ✓ | ✓ | ✓ | | ✓ | ✓ | | | | |
| faculty:create | ✓ | | | | ✓ | | | | | |
| faculty:approve | ✓ | ✓ | | | | | | | | |
| faculty:renew | ✓ | | | | ✓ | | ✓ | | | |
| attendance:read | ✓ | | | | ✓ | ✓ | ✓ | ✓ | | ✓ |
| attendance:manage | ✓ | | | | ✓ | ✓ | | | | |
| attendance:adjust | ✓ | | | | ✓ | | | | | |
| biometric:read | ✓ | | | | | | | | | ✓ |
| biometric:manage | ✓ | | | | ✓ | | | | | |
| monitoring:read | ✓ | | | | | | | | | ✓ |
| monitoring:stream | ✓ | | | | | | | | | ✓ |
| monitoring:capture | ✓ | | | | | | | | | ✓ |
| payments:read | ✓ | | | | ✓ | | ✓ | ✓ | ✓ | |
| payments:create | ✓ | | | | ✓ | | ✓ | ✓ | ✓ | |
| payments:verify | ✓ | | | | | | | | ✓ | |
| payments:refund | ✓ | | | | | | | | ✓ | |
| notifications:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| audit:read | ✓ | | | | | | | | ✓ | |
| documents:upload | ✓ | | | ✓ | ✓ | ✓ | ✓ | | | |
| dashboard:admin | ✓ | | | | | | | | | |
| dashboard:institution | ✓ | | | | ✓ | ✓ | ✓ | | | |
| dashboard:field | ✓ | | | ✓ | | | | | | |
| dashboard:committee | ✓ | | ✓ | | | | | | | |
| dashboard:council | ✓ | ✓ | | | | | | | | |
| dashboard:finance | ✓ | | | | | | | | ✓ | |
| dashboard:monitoring | ✓ | | | | | | | | | ✓ |

## Workflow Permissions

### Institution Registration
`institution_admin` → `field_officer` → `committee_member` → `council_member` → Approved

### Student Registration
`institution_admin/principal` → `committee_member` → Approved

### Faculty Registration
`institution_admin` → `council_member` → Approved

### Renewals
`student/faculty/institution` → Payment → `finance_officer` → Approved
