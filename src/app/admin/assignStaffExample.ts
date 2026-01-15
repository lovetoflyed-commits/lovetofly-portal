// Example: Assigning staff to roles using the staff template and access control
import { Role, hasPermission } from './accessControl';

// Example staff assignments (could be loaded from DB in production)
const staffAssignments = [
  { name: 'Edson Assumpcao', role: Role.MASTER },
  { name: 'Maria Silva', role: Role.OPERATIONS_LEAD },
  { name: 'João Souza', role: Role.SUPPORT_LEAD },
  { name: 'Ana Costa', role: Role.CONTENT_MANAGER },
  { name: 'Carlos Lima', role: Role.BUSINESS_MANAGER },
  { name: 'Fernanda Alves', role: Role.FINANCE_MANAGER },
  { name: 'Lucas Pereira', role: Role.MARKETING },
  { name: 'Patricia Rocha', role: Role.COMPLIANCE },
];

// Example: Check if a staff member has a specific permission
function canPerform(name: string, permission: string) {
  const staff = staffAssignments.find(s => s.name === name);
  if (!staff) return false;
  return hasPermission(staff.role, permission as any);
}

// Usage example
console.log('Can Edson Assumpcao manage system?', canPerform('Edson Assumpcao', 'manage_system'));
console.log('Can João Souza manage finance?', canPerform('João Souza', 'manage_finance'));
