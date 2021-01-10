import { BasicStyleList, CommonTagStyleList } from './styles';
import { COLORS_SAFE, StyleFactory, Styles } from './styles-factory';
import * as commonTags from 'common-tags';

StyleFactory.build(Object.keys(new BasicStyleList()), COLORS_SAFE);

const commonTagsKeys = Object.keys(new CommonTagStyleList());
StyleFactory.build(commonTagsKeys, Object.fromEntries(commonTagsKeys.map(k => [ k, commonTags[ k ] ])));


export const styles = new StyleFactory() as Styles;

// build
export const colors = styles; // backward compatible
