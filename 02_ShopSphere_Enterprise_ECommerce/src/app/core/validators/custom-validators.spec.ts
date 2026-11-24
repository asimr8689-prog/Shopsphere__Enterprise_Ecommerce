import { FormControl, FormGroup } from '@angular/forms';
import { CustomValidators } from './custom-validators';

describe('CustomValidators', () => {
  it('strongPassword requires length, cases, digit and symbol', () => {
    expect(CustomValidators.strongPassword(new FormControl('weak'))).not.toBeNull();
    expect(CustomValidators.strongPassword(new FormControl('Str0ng!pass'))).toBeNull();
  });

  it('matchFields flags mismatching confirmations on the group', () => {
    const group = new FormGroup(
      { password: new FormControl('Abcdef1!'), confirm: new FormControl('nope') },
      { validators: CustomValidators.matchFields('password', 'confirm') },
    );
    expect(group.hasError('fieldsMismatch')).toBeTrue();
    group.controls.confirm.setValue('Abcdef1!');
    expect(group.hasError('fieldsMismatch')).toBeFalse();
  });

  it('cardNumber uses the Luhn checksum', () => {
    expect(CustomValidators.cardNumber(new FormControl('4242 4242 4242 4242'))).toBeNull();
    expect(CustomValidators.cardNumber(new FormControl('4242 4242 4242 4241'))).toEqual({ cardNumber: true });
  });

  it('cardExpiry rejects bad formats and past dates', () => {
    expect(CustomValidators.cardExpiry(new FormControl('13/40'))).toEqual({ cardExpiry: 'format' });
    expect(CustomValidators.cardExpiry(new FormControl('01/20'))).toEqual({ cardExpiry: 'expired' });
    expect(CustomValidators.cardExpiry(new FormControl('12/49'))).toBeNull();
  });

  it('phone and postalCode accept common formats', () => {
    expect(CustomValidators.phone(new FormControl('+92 300 1234567'))).toBeNull();
    expect(CustomValidators.phone(new FormControl('12ab'))).toEqual({ phone: true });
    expect(CustomValidators.postalCode(new FormControl('SW1A 1AA'))).toBeNull();
    expect(CustomValidators.postalCode(new FormControl('!'))).toEqual({ postalCode: true });
  });

  it('compareAtAbovePrice requires the original price to be higher', () => {
    const v = CustomValidators.compareAtAbovePrice();
    expect(v(new FormGroup({ price: new FormControl(50), compareAtPrice: new FormControl(40) }))).toEqual({ compareAtNotAbovePrice: true });
    expect(v(new FormGroup({ price: new FormControl(50), compareAtPrice: new FormControl(null) }))).toBeNull();
  });
});
