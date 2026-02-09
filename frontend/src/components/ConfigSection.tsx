import WidgetConfigurator from './WidgetConfigurator';
import type { Chatbot } from '../types';

// ============================================================
// ConfigSection
// Widget configuration panel wrapping the WidgetConfigurator.
// ============================================================

interface ConfigSectionProps {
  chatbot: Chatbot;
}

function ConfigSection({ chatbot }: ConfigSectionProps) {
  return (
    <div className="animate-fade-in">
      <WidgetConfigurator chatbot={chatbot} />
    </div>
  );
}

export default ConfigSection;
