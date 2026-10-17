import { useRouter } from 'expo-router';

import Button from '@/components/ui/Button';
import type { PapelComissao } from '@/services/comissaoService';
import { useAuthStore } from '@/store/authStore';

type ListaPresencaButtonProps = {
  reuniaoId: number;
  papelNaComissao?: PapelComissao;
};

/**
 * Ponto de integração para a futura tela de reunião. O papel controla apenas
 * a visibilidade; a autorização real caberá à API. Por ora abre a prévia.
 */
export default function ListaPresencaButton({
  reuniaoId,
  papelNaComissao,
}: ListaPresencaButtonProps) {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  if (
    !hasHydrated ||
    (role !== 'ADMIN' && papelNaComissao !== 'ADMINISTRADOR')
  ) {
    return null;
  }

  return (
    <Button
      label="Gerar lista de presença"
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
