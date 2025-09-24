'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { contactSchema, type ContactFormValues } from '@/lib/validation/contact';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', message: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus('idle');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Kontaktanfrage konnte nicht versendet werden.');
      }

      setStatus('success');
      reset();
    } catch (error) {
      console.error('Kontaktformular-Fehler', error);
      setStatus('error');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm" noValidate>
      <div>
        <label className="text-sm font-medium text-neutral-700" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="Vor- und Nachname"
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          aria-invalid={errors.name ? 'true' : 'false'}
          {...register('name')}
        />
        {errors.name ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-sm font-medium text-neutral-700" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@example.ch"
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          aria-invalid={errors.email ? 'true' : 'false'}
          {...register('email')}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-sm font-medium text-neutral-700" htmlFor="message">
          Nachricht
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="Wie können wir unterstützen?"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          aria-invalid={errors.message ? 'true' : 'false'}
          {...register('message')}
        />
        {errors.message ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.message.message}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Wird gesendet …' : 'Anfrage senden'}
      </button>
      <p className="text-xs text-neutral-400">
        Mit dem Absenden akzeptierst du unsere{' '}
        <a href="/legal/datenschutz" className="underline">
          Datenschutzbestimmungen
        </a>
        .
      </p>
      {status === 'success' ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          Danke für deine Nachricht! Wir melden uns so schnell wie möglich.
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Leider gab es ein Problem beim Versand. Bitte versuche es in ein paar Minuten erneut oder melde dich direkt per Telefon.
        </div>
      ) : null}
    </form>
  );
}
