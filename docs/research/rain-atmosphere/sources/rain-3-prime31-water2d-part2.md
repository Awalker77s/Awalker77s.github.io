# Source: Modeling 2D Water With Springs: Part 2 (prime31 blog)

- URL: https://prime31.github.io/water2d-part2/
- Fetch date: 2026-08-27
- Publication date: not shown in fetched excerpt
- License/copyright: not stated in the fetched content
- Author: prime31 (Mike Desaro)

## Verbatim quoted fragments

> "optionally spawning a splash prefab" [note within the splash() method]

> public void splash( Bounds bounds, float velocity )
> {
>   // Checks if spring xPosition falls within bounds.min.x and bounds.max.x
>   // Falls back to finding 2 closest springs with padding
>   // Applies distributed velocity to affected WaterColumns
> }

## Paraphrased mechanics (from fetch, not literal source text but structurally described)
- Collision detected via OnTriggerEnter2D with a BoxCollider2D trigger.
- Affected springs = water columns whose x-position falls within the impacting object's bounds; if none fall within bounds, falls back to the 2 closest springs.
- Total impact velocity is distributed across affected springs: `spring.velocity += force/affectedCount`.

## Confidence
[single-source] for the exact splash-impulse-distribution mechanic (divide impact velocity across affected spring columns) — this is the general "how a falling object drives a splash into a spring water surface" pattern also implied structurally by rain-4's demo (raindrops must inject velocity into the nearest spring on impact), but rain-3 is the only fetched source with explicit collision-bounds-to-spring-mapping logic.
