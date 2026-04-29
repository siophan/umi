import { DeleteOutlined, LoadingOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import { App, Button, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { useState } from 'react';
import type { UploadOssVideoContentType, UploadVideoUsage } from '@umi/shared';

import { uploadAdminOssVideo } from '../lib/api/uploads';

const ALLOWED_MIME = new Set<UploadOssVideoContentType>([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const MAX_BYTES = 50 * 1024 * 1024;

interface AdminOssVideoUploaderProps {
  /** 当前视频 URL（与 antd Form.Item 联动时由 Form 注入） */
  value?: string | null;
  /** 变更回调（与 Form.Item 联动） */
  onChange?: (next: string | null) => void;
  /** OSS 上传 usage 分类，用来分目录 */
  usage: UploadVideoUsage;
  /** 占位提示文案 */
  placeholder?: string;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('视频读取失败'));
    reader.readAsDataURL(file);
  });
}

export function AdminOssVideoUploader({
  value,
  onChange,
  usage,
  placeholder = '上传视频',
}: AdminOssVideoUploaderProps) {
  const { message: messageApi } = App.useApp();
  const [uploading, setUploading] = useState(false);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!ALLOWED_MIME.has(file.type as UploadOssVideoContentType)) {
      messageApi.error('仅支持 mp4 / webm / mov 视频');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_BYTES) {
      messageApi.error('视频不能超过 50MB');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadAdminOssVideo({
        fileName: file.name || 'video',
        contentType: file.type as UploadOssVideoContentType,
        contentBase64: dataUrl,
        usage,
      });
      options.onSuccess?.(result);
      onChange?.(result.url);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '视频上传失败';
      messageApi.error(reason);
      options.onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <video
          src={value}
          controls
          preload="metadata"
          style={{
            width: '100%',
            maxWidth: 360,
            maxHeight: 240,
            borderRadius: 6,
            backgroundColor: '#000',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Upload
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={customRequest}
            accept="video/mp4,video/webm,video/quicktime"
          >
            <Button size="small" loading={uploading}>
              {uploading ? '上传中…' : '替换视频'}
            </Button>
          </Upload>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onChange?.(null)}
          >
            移除
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Upload
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      accept="video/mp4,video/webm,video/quicktime"
    >
      <Button icon={uploading ? <LoadingOutlined /> : <VideoCameraAddOutlined />} loading={uploading}>
        {placeholder}
      </Button>
    </Upload>
  );
}
