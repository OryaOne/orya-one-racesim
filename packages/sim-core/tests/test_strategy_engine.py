from racesim.api.contracts import StrategySuggestionRequest
from racesim.sim.strategies import suggest_strategies


def test_strategy_suggestions_cover_all_drivers():
    suggestions = suggest_strategies(
        StrategySuggestionRequest(grand_prix_id="rainford-harbor-gp", weather_preset_id="mixed-conditions")
    )
    assert len(suggestions) == 12
    assert all(suggestion.rationale for suggestion in suggestions)
    assert all(suggestion.tradeoff for suggestion in suggestions)
