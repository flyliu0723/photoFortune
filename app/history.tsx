import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { cyberTheme } from '@/constants/theme';
import HistorySessionRow from '@/components/HistorySessionRow';
import { useFortuneStore } from '@/stores/fortuneStore';
import type { FortuneSession } from '@/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, setPendingRestore, clearHistory } = useFortuneStore();

  const handleItemPress = (session: FortuneSession) => {
    setPendingRestore(session);
    router.back();
  };

  const handleClear = () => {
    Alert.alert('清空因果', '确定清空所有聊天记录？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => clearHistory() },
    ]);
  };

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearText}>清空因果</Text>
        </TouchableOpacity>
      )}

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>因果未起，尚无记录</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistorySessionRow session={item} onPress={handleItemPress} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cyberTheme.colors.background },
  clearBtn: { alignSelf: 'flex-end', margin: cyberTheme.spacing.md },
  clearText: { color: cyberTheme.colors.danger, fontSize: 13 },
  list: { padding: cyberTheme.spacing.md, paddingTop: 0 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: cyberTheme.colors.textDim, fontSize: 15 },
});
