import { requestWithMessage } from '../api/client';
import endpoints from '../api/endpoints';
import type { UploadedFile } from '../api/types';

export const uploadService = {
    /**
     * POST /admin/upload/upload-single - multipart with `file` and `source`.
     * `source` becomes the folder inside the bucket: pilatix/<source>/<uuid>.<ext>
     */
    single: (file: File, source: string, onProgress?: (percent: number) => void) => {
        const form = new FormData();
        form.append('file', file);
        form.append('source', source);

        return requestWithMessage<UploadedFile>({
            url: endpoints.upload.single,
            method: 'POST',
            data: form,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event) => {
                if (onProgress && event.total) {
                    onProgress(Math.round((event.loaded * 100) / event.total));
                }
            },
        });
    },
};

export default uploadService;
