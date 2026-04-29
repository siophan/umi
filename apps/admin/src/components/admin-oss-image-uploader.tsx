import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useState } from 'react';
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

interface AdminOssImageUploaderProps {
  /** 当前图片 URL（与 antd Form.Item 联动时由 Form 注入） */
  value?: string | null;
  /** 变更回调（与 Form.Item 联动） */
  onChange?: (next: string | null) => void;
  /** OSS 上传 usage 分类，用来分目录 */
  usage: UploadImageUsage;
  /** 占位提示文案 */
  placeholder?: string;
  /** 容器尺寸（picture-card 默认 104）；保持默认即可 */
  size?: number;
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

export function AdminOssImageUploader({
  value,
  onChange,
  usage,
  placeholder = '上传图片',
  size,
}: AdminOssImageUploaderProps) {
  const { message: messageApi } = App.useApp();
  const [uploading, setUploading] = useState(false);

  const fileList: UploadFile[] = value
    ? [
        {
          uid: '-1',
          name: 'cover',
          status: 'done',
          url: value,
        },
      ]
    : [];

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!ALLOWED_MIME.has(file.type)) {
      messageApi.error('仅支持 jpg/png/webp/gif 图片');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_BYTES) {
      messageApi.error('图片不能超过 10MB');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadAdminOssImage({
        fileName: file.name || 'image',
        contentType: file.type as AllowedMime,
        contentBase64: dataUrl,
        usage,
      });
      options.onSuccess?.(result);
      onChange?.(result.url);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '图片上传失败';
      messageApi.error(reason);
      options.onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      maxCount={1}
      fileList={fileList}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      onRemove={() => {
        onChange?.(null);
        return true;
      }}
      accept="image/jpeg,image/png,image/webp,image/gif"
      style={size ? { width: size, height: size } : undefined}
    >
      {fileList.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999' }}>
          {uploading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 4, fontSize: 12 }}>{placeholder}</div>
        </div>
      ) : null}
    </Upload>
  );
}
