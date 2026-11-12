import { useRef, useState } from 'react';
import { usePreventRemove } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import AtaEditor from '@/components/ata/AtaEditor';
import type { AtaEditorHandle } from '@/components/ata/AtaEditor.types';
import AtaLeitura from '@/components/ata/AtaLeitura';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import SectionLabel from '@/components/ui/SectionLabel';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import {
  ataService,
  type Ata,
  type StatusAtaVoto,
} from '@/services/ataService';
import { useAuthStore } from '@/store/authStore';
import { ApiError, getErrorMessage } from '@/utils/apiClient';
import { exportAtaPdf } from '@/utils/ataPdf';

export default function AtaReuniao({
  ata,
  onUpdated,
  onReload,
}: {
  ata: Ata;
  onUpdated: (ata: Ata) => void;
  onReload: () => void;
}) {
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [html, setHtml] = useState(ata.conteudoAta ?? '');
  const [busy, setBusy] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportInProgress = useRef(false);
  const [conflict, setConflict] = useState(false);
  const [pendingHtml, setPendingHtml] = useState<string | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [discarded, setDiscarded] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const editor = useRef<AtaEditorHandle>(null);
  const dirty = html !== (ata.conteudoAta ?? '');
  usePreventRemove(ata.podeEditar && dirty && !discarded, ({ repeat }) => {
    setPendingLeave(() => repeat);
  });

  const handleError = (error: unknown) => {
    if (
      error instanceof ApiError &&
      (error.status === 409 || error.status === 403)
    )
      setConflict(true);
    setFeedback({
      type: 'error',
      message: getErrorMessage(error, 'Não foi possível concluir a ação.'),
    });
  };
  const save = async (content: string) => {
    if (!token) return;
    setBusy(true);
    setPendingHtml(null);
    try {
      const saved = await ataService.save(
        token,
        ata.reuniaoId,
        content,
        ata.versaoAta,
      );
      setPendingHtml(null);
      setHtml(saved.conteudoAta ?? '');
      onUpdated(saved);
      setFeedback({
        type: 'success',
        message: 'Ata salva. A votação está disponível para os presentes.',
      });
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };
  const prepareSave = async () => {
    setBusy(true);
    try {
      const content = await editor.current?.getHtml();
      if (content === undefined) return;
      if (
        ata.votos.aprovados + ata.votos.reprovados > 0 &&
        content !== ata.conteudoAta
      ) {
        setPendingHtml(content);
      } else {
        await save(content);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };
  const vote = async (status: StatusAtaVoto) => {
    if (!token) return;
    setBusy(true);
    try {
      onUpdated(
        await ataService.vote(token, ata.reuniaoId, status, ata.versaoAta),
      );
      setFeedback({ type: 'success', message: 'Seu voto foi registrado.' });
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleExportPdf = async () => {
    if (exportInProgress.current || busy || !ata.conteudoAta) return;
    exportInProgress.current = true;
    setIsExportingPdf(true);
    try {
      await exportAtaPdf({
        titulo: ata.titulo,
        dataReuniao: ata.dataReuniao,
        conteudoAta: ata.conteudoAta,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível exportar a ata para PDF.',
        ),
      });
    } finally {
      exportInProgress.current = false;
      setIsExportingPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      <FeedbackBanner feedback={feedback} />
      <Card>
        <SectionLabel
          label={ata.podeEditar ? 'Redigir ata' : 'Leitura da ata'}
        />
        {ata.podeEditar ? (
          <>
            <AtaEditor
              key={ata.versaoAta}
              ref={editor}
              initialHtml={ata.conteudoAta ?? ''}
              onChange={setHtml}
              disabled={busy || conflict}
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Ao salvar, o texto fica disponível para votação. Alterações no
              conteúdo reiniciam os votos.
            </Text>
            <Button
              label="Salvar"
              isLoading={busy}
              disabled={!dirty || conflict}
              onPress={() => void prepareSave()}
            />
          </>
        ) : ata.conteudoAta ? (
          <AtaLeitura html={ata.conteudoAta} />
        ) : (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            A ata ainda não foi redigida. Aguarde um administrador ou secretário
            salvar o conteúdo.
          </Text>
        )}
        <Button
          label="Exportar PDF"
          icon="download-outline"
          variant="secondary"
          isLoading={isExportingPdf}
          loadingLabel="Gerando PDF..."
          disabled={busy || !ata.conteudoAta}
          accessibilityHint="Exporta a versão salva da ata para guardar ou compartilhar."
          onPress={() => void handleExportPdf()}
        />
        {ata.podeEditar && dirty && ata.conteudoAta ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            O PDF usa a versão salva. Salve as alterações para incluí-las na
            exportação.
          </Text>
        ) : null}
      </Card>
      <Card>
        <SectionLabel label="Votação da ata" />
        <Text style={[styles.body, { color: colors.text }]}>
          Aprovações: {ata.votos.aprovados} · Reprovações:{' '}
          {ata.votos.reprovados}
        </Text>
        {ata.meuVoto ? (
          <Text style={[styles.body, { color: colors.text }]}>
            Seu voto: {ata.meuVoto === 'APROVADO' ? 'Aprovado' : 'Reprovado'}.
            Você pode alterá-lo.
          </Text>
        ) : null}
        {!ata.podeVotar || dirty ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {dirty
              ? 'Salve as alterações antes de votar.'
              : 'A votação será liberada quando a ata estiver salva.'}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            label="Aprovar"
            icon="checkmark-outline"
            disabled={
              !ata.podeVotar ||
              dirty ||
              busy ||
              conflict ||
              ata.meuVoto === 'APROVADO'
            }
            onPress={() => void vote('APROVADO')}
          />
          <Button
            label="Reprovar"
            variant="secondary"
            icon="close-outline"
            disabled={
              !ata.podeVotar ||
              dirty ||
              busy ||
              conflict ||
              ata.meuVoto === 'REPROVADO'
            }
            onPress={() => void vote('REPROVADO')}
          />
        </View>
      </Card>
      <Button
        label="Atualizar ata e votos"
        variant="tertiary"
        disabled={busy}
        onPress={() => (dirty ? setConfirmReload(true) : onReload())}
      />
      <ConfirmDialog
        visible={pendingHtml !== null}
        title="Salvar nova versão?"
        message="O conteúdo será atualizado e os votos atuais serão removidos. Os participantes precisarão votar novamente."
        confirmLabel="Salvar e reiniciar votos"
        variant="warning"
        isLoading={busy}
        onCancel={() => setPendingHtml(null)}
        onConfirm={() => {
          if (pendingHtml !== null) void save(pendingHtml);
        }}
      />
      <ConfirmDialog
        visible={confirmReload}
        title="Descartar alterações?"
        message="As alterações que você ainda não salvou serão descartadas ao carregar a ata atual."
        confirmLabel="Descartar e atualizar"
        variant="warning"
        onCancel={() => setConfirmReload(false)}
        onConfirm={onReload}
      />
      <ConfirmDialog
        visible={pendingLeave !== null}
        title="Sair sem salvar?"
        message="As alterações na ata ainda não foram salvas. Deseja descartá-las?"
        confirmLabel="Descartar e sair"
        variant="warning"
        confirmDisabled={busy}
        onCancel={() => setPendingLeave(null)}
        onConfirm={() => {
          setDiscarded(true);
          pendingLeave?.();
          setPendingLeave(null);
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  body: { ...Typography.body },
  hint: { ...Typography.bodySmall },
});
