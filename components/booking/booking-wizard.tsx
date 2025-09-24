'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { DateTime } from 'luxon';
import { createBooking } from '@/app/booking/actions';
import { formatCurrencyCHF } from '@/lib/datetime';

type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceChf: number;
  staff: StaffOption[];
};

type StaffOption = {
  id: string;
  displayName: string;
  locationName: string;
};

type SlotOption = {
  start: string;
  end: string;
  staffId: string;
  priceChf: number;
};

type BookingWizardProps = {
  services: ServiceOption[];
  defaultDate: string;
};

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Online bezahlen (Stripe, inkl. TWINT)' },
  { id: 'sumup', label: 'Vor Ort bezahlen (SumUp)' },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]['id'];

export function BookingWizard({ services, defaultDate }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [notes, setNotes] = useState('');
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    marketingOptIn: true,
  });
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );

  useEffect(() => {
    if (!selectedServiceId) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    const controller = new AbortController();
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setError(null);
      try {
        const baseDate = DateTime.fromISO(selectedDate, { zone: 'Europe/Zurich' });
        const from = baseDate.startOf('day').toISO();
        const to = baseDate.endOf('day').toISO();
        const response = await fetch('/api/slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            serviceId: selectedServiceId,
            from,
            to,
            staffId: selectedStaffId ?? undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Slots konnten nicht geladen werden.');
        }

        const json = (await response.json()) as { slots: SlotOption[] };
        setSlots(json.slots);
        setSelectedSlot((slot) => (slot ? json.slots.find((item) => item.start === slot.start) ?? null : null));
      } catch (fetchError) {
        console.error(fetchError);
        if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
          setError('Verfügbarkeiten konnten nicht geladen werden.');
        }
      } finally {
        setSlotsLoading(false);
      }
    };

    void fetchSlots();

    return () => controller.abort();
  }, [selectedServiceId, selectedStaffId, selectedDate]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedStaffId(null);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleStaffSelect = (staffId: string | null) => {
    setSelectedStaffId(staffId);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSubmit = () => {
    if (!selectedService || !selectedSlot || !customer.email || !customer.firstName || !customer.lastName) {
      setError('Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const result = await createBooking({
          serviceId: selectedService.id,
          staffId: selectedSlot.staffId,
          slotStart: selectedSlot.start,
          notes: notes.length > 0 ? notes : undefined,
          paymentMethod,
          customer,
        });

        if (result.stripeCheckoutUrl) {
          window.location.href = result.stripeCheckoutUrl;
          return;
        }

        if (result.sumupCheckoutUrl) {
          window.location.href = result.sumupCheckoutUrl;
          return;
        }

        setSuccessMessage('Termin erfolgreich gebucht! Du erhältst gleich eine Bestätigung per E-Mail.');
      } catch (submissionError) {
        console.error(submissionError);
        setError('Die Buchung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Buche deinen Termin</h1>
        <p className="text-lg text-neutral-600">
          Wähle deinen Service, dein Lieblings-Teammitglied und sichere dir deinen Wunschtermin inkl. Zahlung in CHF.
        </p>
      </header>

      <nav aria-label="Buchungsfortschritt" className="flex items-center justify-center gap-4 text-sm font-medium">
        {[1, 2, 3, 4].map((stepIndex) => (
          <div key={stepIndex} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                step >= stepIndex ? 'border-violet-600 bg-violet-600 text-white' : 'border-neutral-300 text-neutral-500'
              }`}
            >
              {stepIndex}
            </span>
            <span className="hidden text-neutral-600 sm:inline">
              {stepIndex === 1 && 'Service'}
              {stepIndex === 2 && 'Stylist:in'}
              {stepIndex === 3 && 'Datum & Zeit'}
              {stepIndex === 4 && 'Bestätigung'}
            </span>
          </div>
        ))}
      </nav>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800">
          <h2 className="text-2xl font-semibold">Merci vielmal!</h2>
          <p className="mt-2">{successMessage}</p>
        </div>
      ) : (
        <section aria-live="polite" className="space-y-8">
          {step >= 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900">1. Service auswählen</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceSelect(service.id)}
                    className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
                      selectedServiceId === service.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-neutral-200 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-lg font-semibold text-neutral-900">{service.name}</span>
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
                        {formatCurrencyCHF(service.priceChf)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">{service.description}</p>
                    <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">
                      Dauer: {service.durationMinutes} Minuten
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step >= 2 && selectedService && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900">2. Teammitglied auswählen</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedService.staff.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleStaffSelect(staff.id)}
                    className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
                      selectedStaffId === staff.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-neutral-200 bg-white hover:border-violet-300'
                    }`}
                  >
                    <span className="text-lg font-medium text-neutral-900">{staff.displayName}</span>
                    <p className="mt-2 text-sm text-neutral-600">Standort: {staff.locationName}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step >= 3 && selectedService && selectedStaffId && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900">3. Datum & Zeit wählen</h2>
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-700" htmlFor="booking-date">
                    Datum
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="flex-[2]">
                  {slotsLoading ? (
                    <p className="text-sm text-neutral-500">Slots werden geladen …</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      Keine freien Slots für dieses Datum. Bitte wähle ein anderes Datum oder Teammitglied.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {slots.map((slot) => {
                        const start = DateTime.fromISO(slot.start).setLocale('de-CH');
                        const end = DateTime.fromISO(slot.end).setLocale('de-CH');
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
                              selectedSlot?.start === slot.start
                                ? 'border-violet-500 bg-violet-50 text-violet-700'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-violet-300'
                            }`}
                          >
                            <span className="block font-semibold">{start.toFormat('HH:mm')}</span>
                            <span className="block text-xs text-neutral-500">bis {end.toFormat('HH:mm')}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step >= 4 && selectedSlot && selectedService && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900">4. Kontaktdaten & Zahlung</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-neutral-700" htmlFor="firstName">
                    Vorname
                  </label>
                  <input
                    id="firstName"
                    value={customer.firstName}
                    onChange={(event) => setCustomer({ ...customer, firstName: event.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700" htmlFor="lastName">
                    Nachname
                  </label>
                  <input
                    id="lastName"
                    value={customer.lastName}
                    onChange={(event) => setCustomer({ ...customer, lastName: event.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700" htmlFor="email">
                    E-Mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700" htmlFor="phone">
                    Mobile
                  </label>
                  <input
                    id="phone"
                    value={customer.phone}
                    onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="notes">
                  Hinweise (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows={3}
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-neutral-700">Zahlungsart</legend>
                {PAYMENT_METHODS.map((method) => (
                  <label key={method.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                    />
                    <span className="text-neutral-700">{method.label}</span>
                  </label>
                ))}
              </fieldset>

              <label className="flex items-center gap-3 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={customer.marketingOptIn}
                  onChange={(event) => setCustomer({ ...customer, marketingOptIn: event.target.checked })}
                />
                Ich möchte Neuigkeiten und Angebote per E-Mail erhalten.
              </label>

              <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <div className="flex items-center justify-between">
                  <span>Service</span>
                  <span>{selectedService.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Datum</span>
                  <span>{DateTime.fromISO(selectedSlot.start).setLocale('de-CH').toFormat('dd.LL.yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Zeit</span>
                  <span>
                    {DateTime.fromISO(selectedSlot.start).setLocale('de-CH').toFormat('HH:mm')} –{' '}
                    {DateTime.fromISO(selectedSlot.end).setLocale('de-CH').toFormat('HH:mm')}
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>{formatCurrencyCHF(selectedSlot.priceChf)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-neutral-700 hover:border-neutral-400"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSubmit}
                  className="rounded-md bg-violet-600 px-6 py-2 font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  {isPending ? 'Wird verarbeitet …' : 'Termin fixieren'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
