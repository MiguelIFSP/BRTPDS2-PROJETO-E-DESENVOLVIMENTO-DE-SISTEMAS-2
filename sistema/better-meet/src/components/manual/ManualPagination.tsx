import { StyleSheet, View } from 'react-native';

import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';

type ManualPaginationProps = {
  currentPage: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
};

export default function ManualPagination({
  currentPage,
  pageCount,
  onPrevious,
  onNext,
  onFinish,
}: ManualPaginationProps) {
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= pageCount - 1;

  return (
    <View style={styles.actions}>
      <Button
        label="Anterior"
        icon="chevron-back"
        variant="secondary"
        disabled={isFirstPage}
        onPress={onPrevious}
      />
      <Button
        label={isLastPage ? 'Concluir' : 'Próximo'}
        icon={isLastPage ? 'checkmark' : 'chevron-forward'}
        accessibilityHint={
          isLastPage
            ? 'Voltar para a aba Mais'
            : 'Abrir a próxima página do manual'
        }
        onPress={isLastPage ? onFinish : onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
