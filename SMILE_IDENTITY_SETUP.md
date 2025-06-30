# Smile Identity Setup Guide

Get real ID verification working in minutes with Smile Identity!

## 🚀 Quick Setup (5 minutes)

### Step 1: Sign Up for Smile Identity

1. **Visit**: https://www.smileidentity.com/
2. **Click**: "Get Started" or "Request Demo"
3. **Fill out the form** with your business details:
   - Company name
   - Your name and email
   - Phone number
   - Country of operation
   - Use case: "Identity verification for apartment rental platform"

### Step 2: Get Your Credentials

After signing up, you'll receive:
- **API Key**: Your authentication key
- **Partner ID**: Your unique partner identifier
- **Documentation**: API integration guide

**Typical response time**: 24-48 hours for sandbox credentials

### Step 3: Update Your Environment Variables

Once you receive your credentials, update your `.env` file:

```env
# Replace with your actual Smile Identity credentials
VITE_SMILE_IDENTITY_API_KEY=your_actual_api_key_here
VITE_SMILE_IDENTITY_PARTNER_ID=your_actual_partner_id_here
VITE_SMILE_IDENTITY_BASE_URL=https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/test

# Enable Smile Identity
VITE_USE_REAL_GOVERNMENT_DB=true
VITE_USE_SMILE_IDENTITY=true
```

### Step 4: Test Real ID Verification

1. **Start your application**
2. **Go to verification page**
3. **Enter a real ID number** (use your own or test IDs provided by Smile Identity)
4. **Complete fingerprint scanning**
5. **See real data retrieved!**

## 📋 Supported Countries & ID Types

### Countries Supported by Smile Identity:
- 🇬🇭 **Ghana**: National ID, Passport, Driver's License, Voter ID
- 🇳🇬 **Nigeria**: NIN, BVN, Passport, Driver's License, Voter ID
- 🇰🇪 **Kenya**: National ID, Passport, Driver's License
- 🇿🇦 **South Africa**: National ID, Passport, Driver's License
- 🇺🇬 **Uganda**: National ID, Passport
- 🇹🇿 **Tanzania**: National ID, Passport
- 🇷🇼 **Rwanda**: National ID, Passport
- 🇿🇲 **Zambia**: National ID, Passport
- 🇧🇼 **Botswana**: National ID, Passport
- 🇳🇦 **Namibia**: National ID, Passport

### ID Format Examples:
```
Ghana: GHA-123456789-1
Nigeria: 12345678901 (NIN)
Kenya: 12345678
South Africa: 1234567890123
```

## 🔧 What You Get

### Real ID Verification:
- ✅ **Actual government database lookups**
- ✅ **Real citizen information retrieval**
- ✅ **Biometric verification**
- ✅ **Document validation**
- ✅ **Fraud detection**

### Data Retrieved:
- Full name
- Date of birth
- Address
- ID photo
- Verification status
- Document validity

## 💰 Pricing

### Sandbox (Free):
- 100 free verifications per month
- All features available
- Test with sample IDs

### Production:
- Pay per verification
- Typically $0.10 - $0.50 per verification
- Volume discounts available
- Enterprise plans available

## 📞 Contact Smile Identity

### Sales & Setup:
- **Email**: sales@smileidentity.com
- **Phone**: +1 (415) 735-4441
- **Website**: https://www.smileidentity.com/contact

### Technical Support:
- **Email**: support@smileidentity.com
- **Documentation**: https://docs.smileidentity.com/
- **GitHub**: https://github.com/smileidentity

### Regional Offices:
- **Nigeria**: Lagos, Abuja
- **Kenya**: Nairobi
- **South Africa**: Cape Town
- **Ghana**: Accra

## 🔒 Security & Compliance

### Security Features:
- ✅ **Bank-grade encryption**
- ✅ **SOC 2 Type II certified**
- ✅ **ISO 27001 compliant**
- ✅ **GDPR compliant**
- ✅ **PCI DSS compliant**

### Data Protection:
- No biometric data stored
- Encrypted data transmission
- Audit trails maintained
- Regular security assessments

## 🚀 Alternative Providers

If Smile Identity doesn't work for you, try these:

### Youverify (Nigeria-focused):
- **Website**: https://youverify.co/
- **Email**: hello@youverify.co
- **Coverage**: Nigeria, Ghana, Kenya

### Prembly (Multi-country):
- **Website**: https://prembly.com/
- **Email**: hello@prembly.com
- **Coverage**: Nigeria, Ghana, Kenya, South Africa

### Flutterwave Identity:
- **Website**: https://flutterwave.com/
- **Email**: developers@flutterwave.com
- **Coverage**: Multiple African countries

## 🎯 Next Steps

### Immediate (Today):
1. ✅ **Sign up for Smile Identity**
2. ✅ **Request sandbox credentials**
3. ✅ **Update environment variables**

### This Week:
1. ✅ **Test with real ID numbers**
2. ✅ **Verify fingerprint scanning works**
3. ✅ **Test error handling**

### Production Ready:
1. ✅ **Upgrade to production plan**
2. ✅ **Implement proper error handling**
3. ✅ **Add monitoring and logging**

## 🔧 Troubleshooting

### Common Issues:

#### "API key not configured":
- Check your `.env` file has correct credentials
- Ensure `VITE_USE_SMILE_IDENTITY=true`
- Restart your development server

#### "Country not supported":
- Check if your country is in Smile Identity's supported list
- Try alternative providers for unsupported countries

#### "Fingerprint scanner not working":
- Ensure you click "OK" when prompted for fingerprint scanning
- Check browser console for error messages
- Try refreshing the page and scanning again

### Getting Help:
1. **Check browser console** for error messages
2. **Contact Smile Identity support** for API issues
3. **Check their documentation** at https://docs.smileidentity.com/

---

## 🎉 You're Ready!

Once you have your Smile Identity credentials:
1. **Update your `.env` file**
2. **Restart your application**
3. **Test with real ID numbers**
4. **Enjoy real government database verification!**

Your apartment rental platform will now have **bank-grade identity verification** just like MTN and other major platforms! 🚀🔒
