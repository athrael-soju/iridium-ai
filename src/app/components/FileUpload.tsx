import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FilePond, registerPlugin } from 'react-filepond';
import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import type { ContextFormValues } from './Context/types';

import '@fortawesome/fontawesome-free/css/all.min.css';
import 'filepond/dist/filepond.min.css';

import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

interface FileUploaderProps {
  namespace: any;
}

const FileUpload: React.FC<FileUploaderProps> = ({ namespace }) => {
  const { setValue, watch } = useFormContext<ContextFormValues>();
  const splittingMethod = watch('splittingMethod');
  const chunkSize = watch('chunkSize');
  const overlap = watch('overlap');

  const [files, setFiles] = useState<any[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const options = {
    splittingMethod,
    chunkSize,
    overlap,
    namespace,
  };

  return (
    <div className="file-upload-container">
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={true}
        maxFiles={3}
        maxParallelUploads={1}
        server={{
          process: (fieldName, file, metadata, load, error, progress) => {
            let formData = new FormData();
            formData.set('file', file);
            console.log('File Upload Initiated...');

            const config: AxiosRequestConfig = {
              onUploadProgress: function (e: AxiosProgressEvent) {
                const total = e?.total ?? 0;
                const percentCompleted = Math.round((e.loaded * 100) / total);

                progress(true, e.loaded, percentCompleted);
                setIngesting(true);
              },
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            };

            axios
              .post('/api/upload', formData, config)
              .then(async function (response) {
                load(response.data);
                console.log('File Upload Successful...');
                let filename = file.name;
                console.log('File Ingest Initiated...');
                const ingestResponse = await axios.post('/api/ingest', {
                  filename,
                  options: options,
                });

                if (
                  ingestResponse.status >= 200 &&
                  ingestResponse.status < 300
                ) {
                  console.log('File Ingest Successful');
                  const { documents } = await ingestResponse.data;
                  setValue('cards', documents);
                  setIngesting(false);
                } else {
                  console.log('File Ingest Failed');
                  throw new Error('File Ingest Failed');
                }
              })
              .catch(function () {
                error('File Upload Failed');
                throw new Error('File Upload Failed');
              });

            return {
              abort: () => {
                // axios does not provide an abort method, so we leave this empty
              },
            };
          },
        }}
        name="file"
        // `<div class="filepond--label-idle"><i class="fas fa-cloud-upload-alt" style="font-size: 60px; color: white; margin-right: 20px;"></i><div >${
        //   ingesting
        //     ? '<span>Ingesting<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></span>'
        //     : 'Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
        // }</div></div>`
        labelIdle={`<div class="filepond--label-idle"
        styles="display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 500; height: 100%; width: 100%; background-color: #353740; border-radius: 10px; border: 2px dashed #4F4F4F; cursor: pointer; padding: 20px; box-sizing: border-box;"
        >
        <CloudArrowUpIcon/>
        </div>`}
      />
      <style jsx>{`
        .file-upload-container {
          position: absolute;
          left: 0;
        }
      `}</style>
    </div>
  );
};

export default FileUpload;
