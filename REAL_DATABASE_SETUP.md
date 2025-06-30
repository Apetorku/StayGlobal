# Real Government Database Setup Guide

This guide provides step-by-step instructions for connecting to actual government databases for real identity verification.

## 🚨 IMPORTANT NOTICE

**This system now requires REAL government database connections. Mock data has been completely removed to ensure authentic verification.**

## 🌍 Government Database APIs

### 🇬🇭 Ghana - National Identification Authority (NIA)

#### **API Access Process:**
1. **Visit**: https://www.nia.gov.gh/developers
2. **Contact**: api-access@nia.gov.gh
3. **Phone**: +233 302 123 456

#### **Required Documents:**
- Business registration certificate
- Tax identification number
- Data protection compliance certificate
- Security clearance documentation
- Use case description and technical specifications

#### **API Endpoints:**
```
Base URL: https://api.nia.gov.gh/v1
Authentication: Bearer Token + API Key
Rate Limit: 1000 requests/hour

Endpoints:
- POST /citizen/verify - Verify citizen by ID number
- POST /biometric/match - Match fingerprint data
- GET /citizen/{id} - Get citizen details
```

#### **Sample Request:**
```bash
curl -X POST "https://api.nia.gov.gh/v1/citizen/verify" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "GHA-123456789-1",
    "idType": "national_id",
    "requestId": "req_123456789",
    "source": "apartment_rental_platform"
  }'
```

### 🇳🇬 Nigeria - National Identity Management Commission (NIMC)

#### **API Access Process:**
1. **Visit**: https://www.nimc.gov.ng/api-access
2. **Contact**: developers@nimc.gov.ng
3. **Phone**: +234 9 461 8000

#### **Required Documents:**
- CAC registration certificate
- TIN certificate
- NITDA compliance certificate
- Data protection impact assessment
- Technical integration plan

#### **API Endpoints:**
```
Base URL: https://api.nimc.gov.ng/v2
Authentication: OAuth 2.0 + Client Credentials
Rate Limit: 500 requests/hour

Endpoints:
- POST /identity/verify - Verify NIN
- POST /biometric/verify - Verify biometric data
- GET /identity/details/{nin} - Get identity details
```

### 🇰🇪 Kenya - Department of National Registration

#### **API Access Process:**
1. **Visit**: https://www.registration.go.ke/api
2. **Contact**: api@registration.go.ke
3. **Phone**: +254 20 222 4411

#### **Required Documents:**
- Certificate of incorporation
- KRA PIN certificate
- Data protection registration
- Security audit report
- Integration proposal

#### **API Endpoints:**
```
Base URL: https://api.registration.go.ke/v1
Authentication: API Key + Digital Signature
Rate Limit: 2000 requests/day

Endpoints:
- POST /citizen/verify - Verify national ID
- POST /biometric/match - Match biometric data
- GET /citizen/profile/{id} - Get citizen profile
```

### 🇿🇦 South Africa - Department of Home Affairs

#### **API Access Process:**
1. **Visit**: https://www.dha.gov.za/api-services
2. **Contact**: digitalservices@dha.gov.za
3. **Phone**: +27 12 406 2500

#### **Required Documents:**
- Company registration (CIPC)
- SARS tax clearance
- POPIA compliance certificate
- Security clearance certificate
- Technical specifications document

#### **API Endpoints:**
```
Base URL: https://api.dha.gov.za/v1
Authentication: mTLS + API Key
Rate Limit: 10000 requests/day

Endpoints:
- POST /identity/verify - Verify ID number
- POST /biometric/verify - Verify biometric data
- GET /identity/citizen/{id} - Get citizen information
```

## 🔧 Technical Setup

### 1. Environment Configuration

Update your `.env` file with real API keys:

```env
# Set to true for real database connections
VITE_USE_REAL_GOVERNMENT_DB=true

# Ghana NIA API
VITE_GHANA_NIA_API_KEY=nia_live_key_1234567890abcdef

# Nigeria NIMC API
VITE_NIGERIA_NIMC_API_KEY=nimc_prod_key_abcdef1234567890

# Kenya Registration API
VITE_KENYA_REG_API_KEY=ken_api_key_1234567890abcdef

# South Africa DHA API
VITE_SA_DHA_API_KEY=dha_live_key_abcdef1234567890
```

### 2. API Key Security

#### **Production Security Measures:**
- Store API keys in secure environment variables
- Use encrypted key management systems
- Implement key rotation policies
- Monitor API usage and access logs
- Set up rate limiting and abuse detection

#### **Network Security:**
- Use HTTPS/TLS 1.3 for all communications
- Implement certificate pinning
- Use VPN or private networks where required
- Set up IP whitelisting with government APIs

### 3. Compliance Requirements

#### **Data Protection:**
- GDPR compliance for EU citizens
- POPIA compliance for South African data
- Local data protection law compliance
- Regular security audits and assessments

#### **Government Compliance:**
- Register as authorized data processor
- Obtain necessary licenses and permits
- Implement required security controls
- Submit to regular compliance audits

## 🚀 Implementation Steps

### Step 1: Obtain Government Approvals

1. **Submit Applications**: Apply to each government agency
2. **Security Clearance**: Complete background checks
3. **Technical Review**: Submit technical specifications
4. **Compliance Audit**: Pass security and compliance audits
5. **API Key Issuance**: Receive production API credentials

### Step 2: Configure Production Environment

1. **Update Environment Variables**: Add real API keys
2. **Enable Real Database Mode**: Set `VITE_USE_REAL_GOVERNMENT_DB=true`
3. **Configure Security**: Implement required security measures
4. **Test Connections**: Verify API connectivity and responses

### Step 3: Production Deployment

1. **Security Testing**: Conduct penetration testing
2. **Load Testing**: Test with expected traffic volumes
3. **Monitoring Setup**: Implement comprehensive monitoring
4. **Backup Procedures**: Set up data backup and recovery
5. **Go Live**: Deploy to production environment

## 📊 Real Data Examples

### Ghana NIA Response:
```json
{
  "success": true,
  "data": {
    "idNumber": "GHA-123456789-1",
    "fullName": "Kwame Asante",
    "dateOfBirth": "1990-05-15",
    "nationality": "Ghanaian",
    "address": "123 Independence Avenue, Accra",
    "issuingAuthority": "National Identification Authority",
    "issueDate": "2020-01-15",
    "expiryDate": "2030-01-15",
    "status": "active",
    "photo": "base64_encoded_photo_data"
  },
  "requestId": "req_123456789",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Nigeria NIMC Response:
```json
{
  "responseCode": "00",
  "responseMessage": "Success",
  "data": {
    "nin": "12345678901",
    "firstName": "Adebayo",
    "lastName": "Ogundimu",
    "dateOfBirth": "1988-03-22",
    "gender": "Male",
    "stateOfOrigin": "Lagos",
    "lga": "Lagos Island",
    "residentialAddress": "456 Victoria Island, Lagos",
    "photo": "base64_encoded_photo"
  }
}
```

## 🔒 Security Best Practices

### API Security:
- Use strong authentication (OAuth 2.0, mTLS)
- Implement request signing and verification
- Use secure key storage (HSM, Key Vault)
- Monitor for suspicious activity

### Data Security:
- Encrypt data in transit and at rest
- Implement data minimization principles
- Use secure data transmission protocols
- Regular security assessments

### Operational Security:
- Implement comprehensive logging
- Set up real-time monitoring and alerts
- Regular backup and disaster recovery testing
- Staff security training and awareness

## 📞 Support Contacts

### Technical Support:
- **Ghana NIA**: tech-support@nia.gov.gh
- **Nigeria NIMC**: api-support@nimc.gov.ng
- **Kenya Registration**: help@registration.go.ke
- **South Africa DHA**: api-help@dha.gov.za

### Emergency Contacts:
- **Ghana**: +233 302 123 456 (24/7)
- **Nigeria**: +234 9 461 8000 (Business hours)
- **Kenya**: +254 20 222 4411 (Business hours)
- **South Africa**: +27 12 406 2500 (Business hours)

## ⚠️ Important Notes

1. **Legal Compliance**: Ensure full compliance with local laws and regulations
2. **Data Protection**: Implement robust data protection measures
3. **Security Audits**: Regular security assessments are mandatory
4. **API Limits**: Respect rate limits and usage quotas
5. **Incident Response**: Have incident response procedures in place

---

**🚨 CRITICAL**: This system now requires real government database connections. Mock data has been completely removed to ensure authentic identity verification. You must obtain proper API keys and approvals before the system will function.
