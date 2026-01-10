/**
 * Format phone number to Brazilian format: +55(XX)XXXXX-XXXX
 * Accepts numbers with or without country code
 */
export function formatBrazilianPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Brazilian phone with country code: 5511987654321 (13 digits)
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    const firstPart = digits.substring(4, 9);
    const secondPart = digits.substring(9, 13);
    return `+55(${ddd})${firstPart}-${secondPart}`;
  }
  
  // Brazilian phone without country code: 11987654321 (11 digits)
  if (digits.length === 11) {
    const ddd = digits.substring(0, 2);
    const firstPart = digits.substring(2, 7);
    const secondPart = digits.substring(7, 11);
    return `+55(${ddd})${firstPart}-${secondPart}`;
  }
  
  // Brazilian landline without country code: 1134567890 (10 digits)
  if (digits.length === 10) {
    const ddd = digits.substring(0, 2);
    const firstPart = digits.substring(2, 6);
    const secondPart = digits.substring(6, 10);
    return `+55(${ddd})${firstPart}-${secondPart}`;
  }
  
  // Return original if format doesn't match
  return phone;
}

/**
 * Apply mask as user types: +55(XX)XXXXX-XXXX
 */
export function maskBrazilianPhone(value: string): string {
  if (!value) return '';
  
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, '');
  
  // Limit to 13 digits (55 + 11 digits)
  if (digits.length > 13) {
    digits = digits.substring(0, 13);
  }
  
  // Start with country code
  let masked = '+55';
  
  if (digits.length > 2) {
    // Remove country code if user typed it
    if (digits.startsWith('55')) {
      digits = digits.substring(2);
    }
    
    // Add DDD (area code)
    if (digits.length > 0) {
      masked += '(' + digits.substring(0, Math.min(2, digits.length));
    }
    
    if (digits.length >= 2) {
      masked += ')';
    }
    
    // Add first part of phone
    if (digits.length > 2) {
      masked += digits.substring(2, Math.min(7, digits.length));
    }
    
    // Add dash and last part
    if (digits.length > 7) {
      masked += '-' + digits.substring(7, Math.min(11, digits.length));
    }
  }
  
  return masked;
}

/**
 * Remove mask from phone number (extract only digits)
 */
export function unmaskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // Keep country code if present
  if (digits.startsWith('55') && digits.length > 11) {
    return digits;
  }
  // Add country code if not present
  if (digits.length === 10 || digits.length === 11) {
    return '55' + digits;
  }
  return digits;
}
