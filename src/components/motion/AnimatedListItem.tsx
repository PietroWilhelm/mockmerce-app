/**
 * Item de lista que ENTRA escalonado (RF-51) e/ou SAI animado (RF-52).
 *
 * As telas só dizem o que querem (`stagger`, `animateExit`); o como fica em
 * theme/motion.ts. Para os itens que FICAM se acomodarem, a lista precisa ser
 * um `Animated.FlatList` com `itemLayoutAnimation={listItemLayout(mode)}` —
 * quem se move é a célula da lista, não o conteúdo dela.
 */
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { listItemEntering, listItemExiting, useMotionMode } from '@/theme/motion';

type Props = {
  children: ReactNode;
  /** Posição na lista, para o atraso escalonado. Sem índice, não escalona. */
  index?: number;
  animateExit?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedListItem({ children, index, animateExit, style }: Props) {
  const mode = useMotionMode();
  return (
    <Animated.View
      style={style}
      entering={index === undefined ? undefined : listItemEntering(mode, index)}
      exiting={animateExit ? listItemExiting(mode) : undefined}
    >
      {children}
    </Animated.View>
  );
}
