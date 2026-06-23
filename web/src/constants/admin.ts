export const PAYS = ['cash', 'transfer', 'mercadopago'] as const;

export const CDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const DS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
};
