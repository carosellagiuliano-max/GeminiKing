import type { Metadata } from 'next';

const team = [
  {
    name: 'Aylin Kaya',
    role: 'Creative Director',
    focus: 'Haute Coiffure & Colour Architecture',
    description:
      'Spezialisiert auf Couture-Schnitte und multidimensionale Farbwelten. Führt das Education-Programm des Salons.',
  },
  {
    name: 'Luca Moretti',
    role: 'Lead Stylist',
    focus: 'Editorial Styling & Grooming',
    description:
      'Bringt internationale Runway-Erfahrung mit und kreiert Looks, die sich mühelos in den Alltag übertragen lassen.',
  },
  {
    name: 'Noemi Steiner',
    role: 'Holistic Therapist',
    focus: 'Scalp Health & Spa Rituals',
    description:
      'Ganzheitliche Behandlungskonzepte mit fokus auf Kopfhaut-Gesundheit, Aromatherapie und mindful beauty.',
  },
];

export const metadata: Metadata = {
  title: 'Team',
  description: 'Lerne unser multidisziplinäres Team kennen, das Schönheit mit Technologie verbindet.',
};

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-primary-600">Team</p>
        <h1 className="mt-3 text-4xl font-semibold text-neutral-900">Expert:innen mit Haltung</h1>
        <p className="mt-4 text-neutral-600">
          Unser Team vereint Kreativität, Präzision und digitales Mindset. Alle Mitarbeitenden werden kontinuierlich in
          inklusiver Beratung und A11y-Standards geschult.
        </p>
      </header>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {team.map(member => (
          <article key={member.name} className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-200">
              <div
                aria-hidden
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop')",
                }}
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-neutral-900">{member.name}</h2>
              <p className="text-sm font-medium text-primary-600">{member.role}</p>
              <p className="text-sm text-neutral-500">{member.focus}</p>
            </div>
            <p className="text-sm text-neutral-600">{member.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
