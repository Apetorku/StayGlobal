# Government Database API Setup Guide

This guide explains how to set up real government database connections for identity verification.

## 🌍 Supported Government Databases

### 🇬🇭 Ghana - National Identification Authority (NIA)
- **Website**: https://www.nia.gov.gh/
- **API Documentation**: https://developers.nia.gov.gh/
- **Contact**: api@nia.gov.gh
- **Services**: National ID verification, biometric matching
- **Format**: `GHA-XXXXXXXXX-X`

### 🇳🇬 Nigeria - National Identity Management Commission (NIMC)
- **Website**: https://www.nimc.gov.ng/
- **API Documentation**: https://developers.nimc.gov.ng/
- **Contact**: developers@nimc.gov.ng
- **Services**: NIN verification, biometric verification
- **Format**: `NINXXXXXXXXXXX`

### 🇰🇪 Kenya - Department of National Registration
- **Website**: https://www.registration.go.ke/
- **API Documentation**: https://api.registration.go.ke/docs
- **Contact**: api@registration.go.ke
- **Services**: National ID verification, citizen records
- **Format**: `KENXXXXXXXX`

### 🇿🇦 South Africa - Department of Home Affairs
- **Website**: https://www.dha.gov.za/
- **API Documentation**: https://developers.dha.gov.za/
- **Contact**: digitalservices@dha.gov.za
- **Services**: ID number verification, biometric services
- **Format**: `ZAXXXXXXXXXXXXX`

### 🇺🇸 United States - Social Security Administration
- **Website**: https://www.ssa.gov/
- **API Documentation**: https://developers.ssa.gov/
- **Contact**: developers@ssa.gov
- **Services**: SSN verification, identity verification

### 🇬🇧 United Kingdom - Gov.UK Identity Service
- **Website**: https://www.gov.uk/
- **API Documentation**: https://docs.api.gov.uk/
- **Contact**: api@digital.cabinet-office.gov.uk
- **Services**: Identity verification, document validation

### 🇨🇦 Canada - Service Canada
- **Website**: https://www.servicecanada.gc.ca/
- **API Documentation**: https://api.servicecanada.gc.ca/docs
- **Contact**: api@servicecanada.gc.ca
- **Services**: SIN verification, identity services

## 🔧 Setup Instructions

### 1. Obtain API Keys

Contact each government agency to obtain production API keys:

1. **Submit Application**: Fill out the API access application form
2. **Business Verification**: Provide business registration documents
3. **Security Clearance**: Complete security background checks
4. **Compliance Review**: Demonstrate GDPR/privacy compliance
5. **API Key Issuance**: Receive production API credentials

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Update the following variables:
```env
# Ghana
VITE_GHANA_NIA_API_KEY=your_actual_api_key

# Nigeria
VITE_NIGERIA_NIMC_API_KEY=your_actual_api_key

# Kenya
VITE_KENYA_REG_API_KEY=your_actual_api_key

# South Africa
VITE_SA_DHA_API_KEY=your_actual_api_key

# Enable real database connections
VITE_USE_REAL_GOVERNMENT_DB=true
```

### 3. API Endpoints

The system connects to these government API endpoints:

#### Ghana NIA
```
Base URL: https://api.nia.gov.gh/v1
Endpoints:
- POST /citizen - Get citizen details
- POST /biometric - Verify biometric data
```

#### Nigeria NIMC
```
Base URL: https://api.nimc.gov.ng/v2
Endpoints:
- POST /identity/details - Get identity details
- POST /biometric/verify - Verify fingerprint
```

#### Kenya Registration
```
Base URL: https://api.registration.go.ke/v1
Endpoints:
- POST /citizen/details - Get citizen information
- POST /biometric/match - Match biometric data
```

### 4. Request Format

All API requests follow this standard format:

```json
{
  "idNumber": "GHA-123456789-1",
  "idType": "national_id",
  "requestId": "req_1234567890_abc123",
  "timestamp": "2024-01-01T12:00:00Z",
  "source": "apartment_rental_platform"
}
```

### 5. Response Format

Government APIs return standardized responses:

```json
{
  "success": true,
  "data": {
    "idNumber": "GHA-123456789-1",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "nationality": "Ghana",
    "address": "123 Main Street, Accra",
    "issuingAuthority": "National Identification Authority",
    "issueDate": "2020-01-01",
    "expiryDate": "2030-01-01",
    "status": "active",
    "photo": "base64_encoded_photo"
  },
  "requestId": "req_1234567890_abc123",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🔒 Security Requirements

### API Security
- **HTTPS Only**: All API calls use TLS 1.3 encryption
- **API Key Authentication**: Bearer token authentication
- **Request Signing**: HMAC-SHA256 request signatures
- **Rate Limiting**: 100 requests per 15 minutes per API key

### Data Protection
- **No Data Storage**: Personal data is not stored locally
- **Encryption in Transit**: All data encrypted during transmission
- **Audit Logging**: All API calls are logged for compliance
- **GDPR Compliance**: Full compliance with data protection regulations

### Access Control
- **IP Whitelisting**: Restrict API access to specific IP addresses
- **Environment Separation**: Separate keys for development/production
- **Key Rotation**: Regular API key rotation (quarterly)

## 🚨 Error Handling

The system handles various error scenarios:

### Common Error Codes
- `400` - Invalid request format
- `401` - Invalid API key
- `403` - Access denied
- `404` - Record not found
- `429` - Rate limit exceeded
- `500` - Government database error

### Fallback Behavior
When government APIs are unavailable:
1. **Retry Logic**: 3 automatic retries with exponential backoff
2. **Circuit Breaker**: Temporary disable after multiple failures
3. **Error Logging**: Detailed error logs for debugging
4. **User Notification**: Clear error messages to users

## 📊 Monitoring & Analytics

### API Monitoring
- **Response Times**: Track API response times
- **Success Rates**: Monitor verification success rates
- **Error Rates**: Track and alert on error rates
- **Usage Analytics**: Monitor API usage patterns

### Compliance Reporting
- **Audit Trails**: Complete audit logs for compliance
- **Data Access Reports**: Track all data access events
- **Security Reports**: Regular security assessment reports

## 🧪 Testing

### Development Mode
Set `VITE_USE_REAL_GOVERNMENT_DB=false` for development testing with mock data.

### Staging Environment
Use sandbox API keys provided by government agencies for testing.

### Production Deployment
Ensure all production API keys are properly configured and tested.

## 📞 Support

For technical support with government API integrations:

1. **Ghana NIA**: api-support@nia.gov.gh
2. **Nigeria NIMC**: support@nimc.gov.ng
3. **Kenya Registration**: help@registration.go.ke
4. **South Africa DHA**: api-help@dha.gov.za

## 📋 Compliance Checklist

Before going live with real government databases:

- [ ] API keys obtained from all required governments
- [ ] Security audit completed
- [ ] GDPR compliance verified
- [ ] Data protection policies in place
- [ ] Error handling tested
- [ ] Monitoring systems configured
- [ ] Backup procedures established
- [ ] Staff training completed

---

**⚠️ Important**: Government database access requires proper authorization and compliance with local data protection laws. Ensure you have all necessary permits and approvals before connecting to production government APIs.
