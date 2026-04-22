import styles from './page.module.css';

export type AddressTag = 'home' | 'work' | 'school' | '';

export type AddressItem = {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  tag: AddressTag;
  isDefault: boolean;
};

export const REGIONS: Record<string, Record<string, string[]>> = {
  北京市: { 北京市: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '通州区', '大兴区'] },
  上海市: { 上海市: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区', '闵行区', '宝山区', '松江区'] },
  浙江省: { 杭州市: ['西湖区', '上城区', '拱墅区', '滨江区', '余杭区', '萧山区', '临平区', '钱塘区'], 宁波市: ['海曙区', '江北区', '鄞州区', '镇海区', '北仑区'], 温州市: ['鹿城区', '龙湾区', '瓯海区', '乐清市'] },
  广东省: { 广州市: ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '番禺区', '花都区', '南沙区'], 深圳市: ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '龙华区', '光明区'], 东莞市: ['南城街道', '东城街道', '莞城街道', '万江街道'] },
  江苏省: { 南京市: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '栖霞区', '江宁区'], 苏州市: ['姑苏区', '吴中区', '相城区', '吴江区', '虎丘区', '工业园区'] },
  四川省: { 成都市: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '高新区', '天府新区'] },
  湖北省: { 武汉市: ['武昌区', '洪山区', '江汉区', '汉阳区', '江岸区', '青山区', '东湖高新区'] },
  福建省: { 福州市: ['鼓楼区', '台江区', '仓山区', '晋安区', '马尾区'], 厦门市: ['思明区', '湖里区', '海沧区', '集美区', '翔安区'] },
  湖南省: { 长沙市: ['岳麓区', '芙蓉区', '天心区', '开福区', '雨花区', '望城区'] },
  山东省: { 济南市: ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区'], 青岛市: ['市南区', '市北区', '崂山区', '李沧区', '城阳区', '黄岛区'] },
};

export function normalizeAddress(
  item: Partial<Omit<AddressItem, 'tag'>> & { id: string | number; tag?: string | null },
): AddressItem {
  return {
    id: String(item.id),
    name: item.name || '',
    phone: item.phone || '',
    province: item.province || '',
    city: item.city || '',
    district: item.district || '',
    detail: item.detail || '',
    tag: item.tag === 'home' || item.tag === 'work' || item.tag === 'school' ? item.tag : '',
    isDefault: Boolean(item.isDefault),
  };
}

export function tagMeta(tag: AddressTag) {
  if (tag === 'home') {
    return { label: '家', icon: 'fa-solid fa-house', cls: styles.home };
  }
  if (tag === 'work') {
    return { label: '公司', icon: 'fa-solid fa-briefcase', cls: styles.work };
  }
  if (tag === 'school') {
    return { label: '学校', icon: 'fa-solid fa-graduation-cap', cls: styles.school };
  }
  return null;
}
