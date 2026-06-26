// Este es un wrapper para usar AddressAutocomplete desde el checkout
// sin cambiar la lógica del cartStore que ya funcionaba.
// Reemplaza el uso directo de <AddressAutocomplete /> en CheckoutForm.tsx
// con <CheckoutAddressAdapter />

'use client';
import { AddressAutocomplete } from '@/features/checkout/components/AddressAutocomplete';
import { useCartStore } from '@/stores/cart.store';
import type { AddressResult } from '@/features/checkout/hooks/useAddressSearch';

export const CheckoutAddressAdapter = () => {
  const deliveryAddress    = useCartStore((s) => s.deliveryAddress);
  const setDeliveryAddress = useCartStore((s) => s.setDeliveryAddress);
  const clearDelivery      = useCartStore((s) => s.clearDelivery);

  const handleChange = (result: AddressResult) => {
    setDeliveryAddress(result.placeName, { lat: result.lat, lng: result.lng });
  };

  return (
    <AddressAutocomplete
      value={deliveryAddress}
      onChange={handleChange}
      onClear={clearDelivery}
    />
  );
};