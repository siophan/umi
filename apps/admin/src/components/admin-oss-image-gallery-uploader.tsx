import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useMemo, useState } from 'react';
import type { UploadImageUsage } from '@umi/shared';

import { uploadAdminOssImage } from '../lib/api/uploads';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_BYTES = 10 * 1024 * 1024;

type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

interface AdminOssImageGalleryUploaderProps {
  value?: string[] | null;
  onChange?: (next: string[]) => void;
  usage: UploadImageUsage;
  /** 最大图片数, 默认 9 */
  maxCount?: number;
  placeholder?: string;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export function AdminOssImageGalleryUploader({
  value,
  onChange,
  usage,
  maxCount = 9,
  placeholder = '上传图片',
}: AdminOssImageGalleryUploaderProps) {
  const { message: messageApi } = App.useApp();
  const [uploadingCount, setUploadingCount] = useState(0);

  const list: string[] = useMemo(
    () => (Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item) : []),
    [value],
  );

  const fileList: UploadFile[] = list.map((url, index) => ({
    uid: `existing-${index}-${url}`,
    name: `image-${index + 1}`,
    status: 'done' as const,
    url,
  }));

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!ALLOWED_MIME.has(file.type)) {
      messageApi.error('仅支持 jpg/png/webp/gif 图片');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_BYTES) {
      messageApi.error('图片不能超过 10MB');
      return Upload.LIST_IGNORE;
    }
    if (list.length + uploadingCount >= maxCount) {
      messageApi.error(`最多上传 ${maxCount} 张图片`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    setUploadingCount((n) => n + 1);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadAdminOssImage({
        fileName: file.name || 'image',
        contentType: file.type as AllowedMime,
        contentBase64: dataUrl,
        usage,
      });
      options.onSuccess?.(result);
      onChange?.([...list, result.url]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '图片上传失败';
      messageApi.error(reason);
      options.onError?.(error as Error);
    } finally {
      setUploadingCount((n) => Math.max(0, n - 1));
    }
  };

  const handleRemove: UploadProps['onRemove'] = (file) => {
    if (typeof file.url !== 'string') return false;
    onChange?.(list.filter((url) => url !== file.url));
    return true;
  };

  const showUploadButton = list.length + uploadingCount < maxCount;

  return (
    <Upload
      listType="picture-card"
      multiple
      fileList={fileList}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      onRemove={handleRemove}
      accept="image/jpeg,image/png,image/webp,image/gif"
    >
      {showUploadButton ? (
        <div style={{ textAlign: 'center', color: '#999' }}>
          {uploadingCount > 0 ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 4, fontSize: 12 }}>{placeholder}</div>
        </div>
      ) : null}
    </Upload>
  );
}
