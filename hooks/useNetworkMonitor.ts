import { useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useVehicleStore } from '../store/vehicleStore';

export function useNetworkMonitor() {
  const { isOnline, setOnline, syncQueue_process, loadSyncQueue } = useVehicleStore();
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    NetInfo.fetch().then((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setOnline(online);
      wasOfflineRef.current = !online;
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setOnline(online);
      if (online && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        loadSyncQueue().then(() => syncQueue_process());
      } else if (!online) {
        wasOfflineRef.current = true;
      }
    });

    return () => unsubscribe();
  }, [setOnline, syncQueue_process, loadSyncQueue]);

  return { isOnline };
}
