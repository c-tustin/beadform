# How Beadform chooses stitches

The text/image model receives the [pre-made stitch guide](../guides/stitch-selection.json) with **every generation request**, including requests sent to local Qwen through Ollama. Edit that file to refine the guidance, then restart the local server. No training run, paid model or external retrieval service is required to load the guide.

The model compares shape, outline, bead orientation, flexibility and attachment needs for each part. It is asked to explain its choice and main compromise in the scene notes. These are starting heuristics, not a universal ranking of stitches:

| Design need | Techniques to consider |
| --- | --- |
| Rounded, shaped surface | Shaped peyote; compare support and construction needs |
| Flat fabric | Flat peyote, brick, square stitch or RAW, depending on outline and bead orientation |
| Shaped flat wing or petal | Brick is a candidate; compare a peyote layout or loop-based panel |
| Flexible loop-based panel | RAW |
| Blocky volume or cube frame | CRAW |
| Narrow strip or foundation | Ladder |
| Rope or tube | Tubular peyote, brick or herringbone, depending on the design |
| Open covering or wrap | Netting |

Peyote can be flat. Brick can be tubular. A round-looking object alone is not enough to decide. The guide links to technique references from the Beadworkers Guild and Fire Mountain Gems, with original summaries rather than copied patterns or tutorials.

## What the current compiler actually makes

The guide **does not add stitch generators**. Parts mode currently has shaped peyote, CRAW blocks, angle-weave panels/tubes and return strands. Lattice mode is CRAW. Brick, ladder, herringbone, square stitch and netting remain advice for future implementation or manual planning. The model must disclose an unavailable requested technique and identify the actual approximation; it must not rename a RAW panel as brick or a return strand as ladder.

The JSON scene format and computed bead counts/routes stay unchanged. The generation response includes `checks.stitchGuideVersion` so callers can identify the guidance used. The trained catalog adapters only select a draft ID; they do not choose stitches, and this change does not retrain or deploy them. Opening the offline HTML alone does not invoke a model or this server-side guide.

## Where to change it

- [Guide data](../guides/stitch-selection.json): candidate uses, limitations, current compiler support and source links.
- [Prompt formatter](../stitch-guide.mjs): loads the local guide and adds mode-specific constraints.
- [Generation server](../server.mjs): includes the guide in every provider request.

The guide is advisory; a model can still make a poor choice. Physical sampling remains necessary, especially for shaped surfaces, joins and finishes. Digital checks and a model's explanation do not prove beadability.

## Experimental stitch recipe training (November 3, 2026)

A separate [Qwen recipe pilot](../training/stitch-program-v1/README.md) now has draft flat brick and ladder generators alongside the existing flat peyote, RAW and square engine. This does not make those stitches selectable in the 3D scene compiler. The pilot changes a new adapter’s weights to select a technique and specify bounded recipe parameters, then code computes the pattern. New 3D parts plans separately prefer five passages for 11/0 beads and 0.20 mm thread, with visible exceptions. See the pilot guide for the different assembly-only versus proposed-finishing ledgers.
