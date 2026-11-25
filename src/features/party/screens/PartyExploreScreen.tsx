import React from 'react';
import PartyExplore from '../../../../Components/PartyExplore';

export interface PartyExploreScreenProps {
  navigation?: any;
  route?: any;
}

export function PartyExploreScreen({ navigation, route }: PartyExploreScreenProps) {
  return <PartyExplore navigation={navigation} route={route} />;
}

export default PartyExploreScreen;
