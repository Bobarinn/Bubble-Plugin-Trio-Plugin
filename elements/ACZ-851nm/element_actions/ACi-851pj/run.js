function(instance, properties, context) {
   // Get full array of presigned URLs
   const presignedUrls = properties.presigned_urls.get(0, properties.presigned_urls.length());
   console.log('Presigned URLs:', presignedUrls);
   
   const files = window.fileData;

   const uploadFile = async (file, uploadUrl) => {
       try {
           const response = await fetch(uploadUrl, {
               method: 'PUT',
               body: file
           });
           return response.ok;
       } catch (error) {
           return false;
       }
   };

   const processUploads = async () => {
       let uploadedCount = 0;
       const successfulUploads = [];
       const failedUploads = [];

       for (let i = 0; i < files.length; i++) {
           const success = await uploadFile(files[i], presignedUrls[i]);
           
           if (success) {
               successfulUploads.push(files[i].name);
               uploadedCount++;
           } else {
               failedUploads.push(files[i].name);
           }
           instance.publishState('uploaded_files_count', uploadedCount);
       }

       instance.publishState('successful_uploads', successfulUploads);
       instance.publishState('failed_uploads', failedUploads);
       instance.publishState('status', uploadedCount === files.length ? 'Completed' : 'Partial');
       instance.data.selectedFiles = [];      // Array to store the selected files
    instance.data.uploadedFiles = [];      // Array to store successfully uploaded file names
    instance.data.failedFiles = [];        // Array to store failed uploads
    instance.data.uploadProgress = {};
   };

   processUploads();
}