import { Bot, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.js';

const features = [
  {
    title: 'Backed by live RentMate data',
    description:
      'The assistant blends AI with real listings, contracts, and payment schedules.',
    icon: ShieldCheck,
  },
  {
    title: 'Always available',
    description:
      'Ask about a property, lease terms, or payment reminders at any time.',
    icon: MessageSquare,
  },
  {
    title: 'Share with landlords',
    description:
      'Forward conversations to owners directly from the same chat thread.',
    icon: Sparkles,
  },
];

const AssistantPromo = () => {
  const { t } = useI18n();
  const openChat = () => {
    window.dispatchEvent(new Event('rentmate:chat-open'));
  };

  return (
    <section className="mt-12 grid gap-6 rounded-3xl border border-gray-100 bg-gradient-soft p-6 shadow-floating-card lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
          RentMate AI Lab
        </p>
        <h2 className="text-3xl font-semibold text-brand">
          {t('assistant.title', 'An assistant that understands your rental context')}
        </h2>
        <p className="text-sm text-gray-600">
          {t(
            'assistant.subtitle',
            'Every reply is grounded in the backend: property data, contracts, notifications, and payments. No hallucinated numbers.',
          )}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openChat}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft-glow transition hover:opacity-90"
          >
            {t('assistant.open', 'Open AI chat')}
            <Bot className="h-4 w-4" />
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold text-gray-600">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('assistant.beta', 'Beta')}
          </span>
        </div>
      </div>
      <div className="grid gap-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="flex gap-4 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-brand">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AssistantPromo;
