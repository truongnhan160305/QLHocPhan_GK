import * as ImagePicker from 'expo-image-picker';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebase';

type GiangVien = {
  id: string;
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
};

// Hiện thông báo (web và điện thoại khác nhau)
const showMsg = (msg: string) => {
  if (Platform.OS === 'web') window.alert(msg);
  else Alert.alert('Thông báo', msg);
};

// Hộp xác nhận xóa
const confirmDelete = (onYes: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm('Bạn có chắc muốn xóa?')) onYes();
  } else {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa?', [
      { text: 'Hủy' },
      { text: 'Xóa', onPress: onYes },
    ]);
  }
};

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [list, setList] = useState<GiangVien[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idgv, setIdgv] = useState('');
  const [fullname, setFullname] = useState('');
  const [image, setImage] = useState('');
  const [sumClass, setSumClass] = useState('');
  const [keyword, setKeyword] = useState('');

  // Lọc danh sách theo tên hoặc mã giảng viên (không phân biệt hoa thường)
  const filteredList = list.filter((i) => {
    const k = keyword.trim().toLowerCase();
    return (
      i.Fullname.toLowerCase().includes(k) ||
      i.IDGV.toLowerCase().includes(k)
    );
  });

  // Theo dõi trạng thái đăng nhập
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  // Tự động lấy danh sách giảng viên từ Firebase
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'GiangVien'), (snap) => {
      setList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GiangVien, 'id'>) })));
    });
  }, [user]);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      showMsg('Sai email hoặc mật khẩu');
    }
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.2,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!r.canceled && r.assets[0].base64) {
      setImage('data:image/jpeg;base64,' + r.assets[0].base64);
    }
  };

  const resetForm = () => {
    setEditingId(null); setIdgv(''); setFullname(''); setImage(''); setSumClass('');
  };

  const save = async () => {
    if (!idgv.trim() || !fullname.trim()) {
      showMsg('Nhập IDGV và Fullname');
      return;
    }
    // CHỈ 4 trường theo đề
    const data = {
      IDGV: idgv.trim(),
      Fullname: fullname.trim(),
      Image: image,
      SumClass: Number(sumClass) || 0,
    };
    try {
      if (editingId) await updateDoc(doc(db, 'GiangVien', editingId), data);
      else await addDoc(collection(db, 'GiangVien'), data);
      resetForm();
    } catch (e: any) {
      console.log(e);
      showMsg('Lỗi: ' + (e?.message || e));
    }
  };

  const startEdit = (item: GiangVien) => {
    setEditingId(item.id);
    setIdgv(item.IDGV);
    setFullname(item.Fullname);
    setImage(item.Image || '');
    setSumClass(String(item.SumClass));
  };

  // ===== MÀN HÌNH ĐĂNG NHẬP =====
  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.title}>Đăng nhập Admin</Text>
        <TextInput style={s.input} placeholder="Email" value={email}
          onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Mật khẩu" value={password}
          onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={s.btn} onPress={login}>
          <Text style={s.btnText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ===== MÀN HÌNH QUẢN LÝ =====
  return (
    <View style={s.container}>
      <View style={s.row}>
        <Text style={s.title}>Quản lý giảng viên</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={{ color: 'red' }}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={s.input} placeholder="IDGV (Mã giảng viên)" value={idgv} onChangeText={setIdgv} />
      <TextInput style={s.input} placeholder="Fullname (Họ và tên)" value={fullname} onChangeText={setFullname} />
      <TextInput style={s.input} placeholder="SumClass (Tổng số lớp)" value={sumClass}
        onChangeText={setSumClass} keyboardType="numeric" />

      <View style={s.row}>
        <TouchableOpacity style={[s.btn, { backgroundColor: '#888' }]} onPress={pickImage}>
          <Text style={s.btnText}>Chọn ảnh</Text>
        </TouchableOpacity>
        {image ? <Image source={{ uri: image }} style={s.avatar} /> : null}
      </View>

      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={s.btn} onPress={save}>
          <Text style={s.btnText}>{editingId ? 'Cập nhật' : 'Thêm mới'}</Text>
        </TouchableOpacity>
        {editingId ? (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#888' }]} onPress={resetForm}>
            <Text style={s.btnText}>Hủy sửa</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TextInput
        style={s.input}
        placeholder="🔍 Tìm theo tên hoặc mã giảng viên..."
        value={keyword}
        onChangeText={setKeyword}
      />
      <FlatList
        data={filteredList}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={s.item}>
            {item.Image
              ? <Image source={{ uri: item.Image }} style={s.avatar} />
              : <View style={s.avatar} />}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.Fullname}</Text>
              <Text>Mã: {item.IDGV}</Text>
              <Text>Tổng số lớp: {item.SumClass}</Text>
            </View>
            <TouchableOpacity onPress={() => startEdit(item)}>
              <Text style={{ color: 'blue', marginRight: 12 }}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(() => deleteDoc(doc(db, 'GiangVien', item.id)))}>
              <Text style={{ color: 'red' }}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 20, maxWidth: 500, width: '100%', alignSelf: 'center' },
  container: { flex: 1, padding: 20, paddingTop: 40, maxWidth: 700, width: '100%', alignSelf: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 10 },
  btn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 6, marginRight: 10, marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ddd' },
});