import drivers from "../../../data/drivers/drivers.json";
import teams from "../../../data/drivers/teams.json";
import grandsPrix from "../../../data/tracks/grands_prix.json";
import strategyTemplates from "../../../data/strategies/strategy_templates.json";
import weatherPresets from "../../../data/weather/weather_event_priors.json";

export const catalogFallback = {
  drivers,
  teams,
  grands_prix: grandsPrix,
  strategy_templates: strategyTemplates,
  weather_presets: weatherPresets,
};
