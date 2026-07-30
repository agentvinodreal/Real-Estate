import { Tabs, Redirect } from 'expo-router'
import { Platform } from 'react-native'
import { colors } from '../../theme/colors'
import { useAccessGate } from '../../hooks/useAccessGate'
import { PropertiesIcon, ServicemenIcon, ShopsIcon, ProfileIcon } from '../../components/NavIcons'

export default function TabLayout() {
  const gate = useAccessGate()

  if (gate.status === 'loading') return null
  if (gate.status === 'signed-out') return <Redirect href="/sign-in" />
  if (gate.status === 'pending') return <Redirect href="/pending-access" />

  return (
    <Tabs
      screenOptions={{
        headerShown:         false,
        tabBarActiveTintColor:   colors.ochre,
        tabBarInactiveTintColor: colors.concrete,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor:  colors.sand,
          borderTopWidth:  1,
          height: Platform.OS === 'android' ? 60 : 80,
          paddingBottom: Platform.OS === 'android' ? 8 : 20,
        },
        // Mirrors the web's .nav-item-label: mono, uppercase, wide tracking.
        tabBarLabelStyle: {
          fontSize:       10,
          fontWeight:     '600',
          textTransform:  'uppercase',
          letterSpacing:  0.5,
        },
      }}
    >
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ focused }) => <PropertiesIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="labour"
        options={{
          title: 'Servicemen',
          tabBarIcon: ({ focused }) => <ServicemenIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shops"
        options={{
          title: 'Shops',
          tabBarIcon: ({ focused }) => <ShopsIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
    </Tabs>
  )
}
