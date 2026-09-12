import { FC, Fragment, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Pageheader from '../../components/common/page-header/pageheader';
import SpkButton from '../../@spk/uielements/spk-button';
import Spktables from '../../@spk/tables/spk-tables';
import TableState from '../../components/common/table/table-state';
import Select from '../../components/common/form/select';
import { ApiError } from '../../api/client';
import type { UploadedFile } from '../../api/types';
import uploadService from '../../services/upload.service';
import { formatBytes, formatDateTime } from '../../utils/format';

/** multer on the backend caps uploads at 10MB (middlewares/multer.middleware.ts). */
const MAX_BYTES = 10 * 1024 * 1024;

/** `source` becomes the bucket folder: pilatix/<source>/<uuid>.<ext> */
const SOURCES = ['resource', 'font', 'profile', 'document', 'thumbnail'];

const FileUpload: FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [source, setSource] = useState(SOURCES[0]);
    const [customSource, setCustomSource] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    /** Uploads made in this session; the API has no listing endpoint. */
    const [uploaded, setUploaded] = useState<UploadedFile[]>([]);

    const effectiveSource = useCustom ? customSource.trim() : source;

    const pickFile = (next: File | null) => {
        setError(null);
        if (next && next.size > MAX_BYTES) {
            setError(`“${next.name}” is ${formatBytes(next.size)}. The API rejects anything over 10 MB.`);
            setFile(null);
            return;
        }
        setFile(next);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        pickFile(event.dataTransfer.files?.[0] ?? null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Choose a file first.');
            return;
        }
        if (!effectiveSource) {
            setError('A source folder is required by the API.');
            return;
        }

        setUploading(true);
        setProgress(0);
        setError(null);
        try {
            const result = await uploadService.single(file, effectiveSource, setProgress);
            toast.success(result.message || 'File uploaded.');
            setUploaded((prev) => [result.payload, ...prev]);
            setFile(null);
            if (inputRef.current) inputRef.current.value = '';
        } catch (err) {
            const messageText = err instanceof ApiError ? err.message : 'Upload failed.';
            setError(messageText);
            toast.error(messageText);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const copy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('URL copied.');
        } catch {
            toast.error('Could not copy to the clipboard.');
        }
    };

    return (
        <Fragment>
            <Pageheader currentpage="File upload" activepage="Media" mainpage="File upload" />

            <div className="grid grid-cols-12 gap-6">
                <div className="xl:col-span-5 col-span-12">
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">Upload a file</div>
                        </div>
                        <div className="box-body">
                            {error && (
                                <div className="bg-danger/10 text-danger text-[0.8125rem] rounded-md px-3 py-2 mb-4" role="alert">
                                    <i className="ti ti-alert-circle me-1 align-middle"></i>
                                    {error}
                                </div>
                            )}

                            <div
                                className="border border-dashed border-defaultborder dark:border-defaultborder/10 rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => inputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
                                }}
                            >
                                <i className="ti ti-cloud-upload text-[1.75rem] text-primary"></i>
                                <p className="text-[0.8125rem] font-semibold mt-2 mb-1">
                                    {file ? file.name : 'Drop a file here or click to browse'}
                                </p>
                                <p className="text-[0.6875rem] text-[#8c9097] dark:text-white/50 mb-0">
                                    {file ? `${formatBytes(file.size)} · ${file.type || 'unknown type'}` : 'Up to 10 MB'}
                                </p>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    className="hidden"
                                    aria-label="Choose a file to upload"
                                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                                />
                            </div>

                            <div className="mt-4">
                                <label id="upload-source-label" htmlFor="upload-source" className="form-label">
                                    Source folder <span className="text-danger">*</span>
                                </label>
                                {useCustom ? (
                                    <input
                                        id="upload-source"
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. banners"
                                        value={customSource}
                                        onChange={(e) => setCustomSource(e.target.value)}
                                    />
                                ) : (
                                    <Select
                                        id="upload-source"
                                        size="md"
                                        labelledBy="upload-source-label"
                                        icon="ri-folder-line"
                                        value={source}
                                        onChange={setSource}
                                        options={SOURCES.map((value) => ({ value, label: value }))}
                                    />
                                )}
                                <div className="form-check !ps-0 mt-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="upload-custom-source"
                                        checked={useCustom}
                                        onChange={(e) => setUseCustom(e.target.checked)}
                                    />
                                    <label
                                        className="form-check-label text-[#8c9097] dark:text-white/50 font-normal"
                                        htmlFor="upload-custom-source"
                                    >
                                        Use a custom folder name
                                    </label>
                                </div>
                                <span className="block text-[0.6875rem] text-[#8c9097] dark:text-white/50 mt-2">
                                    Stored as <code>pilatix/{effectiveSource || '<source>'}/&lt;uuid&gt;.&lt;ext&gt;</code>
                                </span>
                            </div>

                            {uploading && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-[0.6875rem] mb-1">
                                        <span className="text-[#8c9097] dark:text-white/50">Uploading…</span>
                                        <span className="font-semibold">{progress}%</span>
                                    </div>
                                    <div className="progress progress-xs">
                                        <div
                                            className="progress-bar bg-primary"
                                            role="progressbar"
                                            style={{ width: `${progress}%` }}
                                            aria-valuenow={progress}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="box-footer flex items-center justify-end gap-2">
                            <SpkButton
                                buttontype="button"
                                variant="light"
                                customClass="ti-btn !font-medium"
                                disabled={uploading || !file}
                                onclickfunc={() => {
                                    setFile(null);
                                    setError(null);
                                    if (inputRef.current) inputRef.current.value = '';
                                }}
                            >
                                Clear
                            </SpkButton>
                            <SpkButton
                                buttontype="button"
                                disabled={uploading || !file}
                                onclickfunc={handleUpload}
                                customClass="ti-btn !bg-primary !text-white !font-medium disabled:opacity-60"
                            >
                                {uploading ? 'Uploading…' : 'Upload'}
                            </SpkButton>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-7 col-span-12">
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">Uploaded in this session</div>
                        </div>
                        <div className="box-body !p-0">
                            <div className="table-responsive">
                                <Spktables
                                    tableClass="table whitespace-nowrap min-w-full ti-custom-table ti-custom-table-hover"
                                    headerClass="bg-light"
                                    tableRowclass="border-b border-defaultborder"
                                    header={[
                                        { title: 'File' },
                                        { title: 'Size' },
                                        { title: 'Uploaded' },
                                        { title: 'Link', headerClassname: 'text-end' },
                                    ]}
                                >
                                    <TableState
                                        colSpan={4}
                                        loading={false}
                                        empty={uploaded.length === 0}
                                        emptyText="Nothing uploaded yet. The API does not list previous uploads."
                                    />

                                    {uploaded.map((item) => (
                                        <tr className="border-b border-defaultborder" key={item.key}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="avatar avatar-xs avatar-rounded bg-primary/10 text-primary inline-flex items-center justify-center">
                                                        <i className="ti ti-file text-[0.75rem]"></i>
                                                    </span>
                                                    <div className="max-w-[14rem]">
                                                        <span className="font-semibold block leading-tight truncate" title={item.originalname}>
                                                            {item.originalname}
                                                        </span>
                                                        <span className="text-[0.6875rem] text-[#8c9097] dark:text-white/50">
                                                            {item.mimetype}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatBytes(item.size)}</td>
                                            <td>{formatDateTime(item.createdAt)}</td>
                                            <td className="text-end">
                                                <div className="flex items-center justify-end gap-2">
                                                    <SpkButton
                                                        buttontype="button"
                                                        Label={`Copy URL for ${item.originalname}`}
                                                        variant="light"
                                                        customClass="ti-btn ti-btn-sm !font-medium"
                                                        onclickfunc={() => copy(item.url)}
                                                    >
                                                        <i className="ri-file-copy-line"></i>
                                                    </SpkButton>
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        aria-label={`Open ${item.originalname}`}
                                                        className="ti-btn ti-btn-sm ti-btn-light !font-medium !mb-0"
                                                    >
                                                        <i className="ri-external-link-line"></i>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </Spktables>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default FileUpload;
