import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';

export default function NotFoundScreen() {
  const { t } = useLanguage();
  
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.text}>{t('notFound.message')}</Text>
        <Link href="/" style={styles.link}>
          <Text>{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 600,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
