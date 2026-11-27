import { useRouter } from 'expo-router';

import Button from '@/components/ui/Button';
import type { PapelComissao } from '@/services/comissaoService';
import { useAuthStore } from '@/store/authStore';

type ListaPresencaButtonProps = {
  reuniaoId: number;
  papelNaComissao?: PapelComissao;
  criadoPorUserId?: number | null;
};

export default function ListaPresencaButton({
  reuniaoId,
  papelNaComissao,
  criadoPorUserId,
}: ListaPresencaButtonProps) {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const userId = useAuthStore((state) => state.user?.id);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  if (
    !hasHydrated ||
    (role !== 'ADMIN' &&
      papelNaComissao !== 'ADMINISTRADOR' &&
      userId !== criadoPorUserId)
  ) {
    return null;
  }

  return (
    <Button
      label="Ver lista de presença"
      icon="document-text-outline"
      variant="secondary"
      onPress={() =>
        router.push({
          pathname: '/lista-presenca',
          params: { reuniaoId: String(reuniaoId) },
        })
      }
    />
  );
}
