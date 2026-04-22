# Mobile (Expo) Performance (ACH-023 performance-escalabilidade)

## Current state

`FlatList` usages in `apps/mobile/src/screens/*-list-screen.tsx`
don't set `windowSize`, `updateCellsBatchingPeriod`, or `initialNumToRender`.
`renderItem` is defined inline — React re-creates the callback on
every render so `React.memo` on the row component never hits cache.

## Recipe

```tsx
import { FlatList, type ListRenderItem } from 'react-native';
import { memo, useCallback } from 'react';

const Row = memo(({ item }: { item: Client }) => (
  /* ... */
));

const keyExtractor = (c: Client) => c.id;

function ClientsListScreen() {
  const renderItem: ListRenderItem<Client> = useCallback(
    ({ item }) => <Row item={item} />,
    [],
  );

  return (
    <FlatList
      data={clients}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // ACH-023 performance-escalabilidade:
      windowSize={10}
      initialNumToRender={15}
      maxToRenderPerBatch={15}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
    />
  );
}
```

### What the flags do

- `windowSize={10}` — render ≈ 10 × visible viewport; drops off-screen
  views aggressively.
- `initialNumToRender={15}` — initial burst; above-the-fold without
  hydrating the rest.
- `maxToRenderPerBatch`, `updateCellsBatchingPeriod` — batch
  subsequent hydration in 50 ms slots so scrolling stays smooth.
- `removeClippedSubviews` — native-level culling (iOS-only cheap
  wins).

## Migration

- Apply to the three high-cardinality screens first: clients, sales,
  schedule.
- Measure with Flipper / Perf Monitor before and after; typical wins
  are ~30% frame-time reduction on 100+ item lists.
- Keep the recipe documented here so new list screens adopt the flags
  from day one.
