function(instance, properties, context) {
    console.log("Starting file upload process");

    // Hardcoded allowed extensions
    const allowedExtensions = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const maxSize = properties.size * 1024; // Maximum file size

    // Example configuration object - set these values dynamically
    const awsConfig = {
        region: properties.region, // AWS region
        accesskeyid: properties.accesskeyid, // Your AWS access key ID
        secretaccesskey: properties.secretaccesskey, // Your AWS secret access key
        sessiontoken: properties.sessiontoken // Your AWS session token (if applicable)
    };

    const bucketName = properties.bucketname; // S3 bucket name
    const userId = properties.userid; // Unique identifier for the user
    const unixTimeStamp = properties.timestamp; // Use provided timestamp

    const configureAWS = (config) => {
        AWS.config.update({
            region: config.region,
            credentials: new AWS.Credentials({
                accessKeyId: config.accesskeyid,
                secretAccessKey: config.secretaccesskey,
                sessionToken: config.sessiontoken
            })
        });
    };

    configureAWS(awsConfig);

    const uploadFileToS3 = (file) => {
        return new Promise((resolve, reject) => {
            console.log('Starting upload for file:', file.name);
            
            if (!file || !(file instanceof File)) {
                console.error('Invalid file object:', file);
                reject(new Error('Invalid file object'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                console.log('File read successfully');
                const fileContent = e.target.result;
                
                if (!fileContent) {
                    console.error('File content is empty');
                    reject(new Error('File content is empty'));
                    return;
                }

                console.log('File content length:', fileContent.byteLength);

                const s3 = new AWS.S3();
                const fileName = file.name;
                const fileKey = `${userId}/${unixTimeStamp}/${fileName}`;

                const uploadParams = {
                    Bucket: bucketName,
                    Key: fileKey,
                    Body: new Uint8Array(fileContent),
                    ContentType: file.type
                };

                console.log('Uploading to S3 with params:', JSON.stringify({
                    Bucket: uploadParams.Bucket,
                    Key: uploadParams.Key,
                    ContentType: uploadParams.ContentType
                }, null, 2));

                try {
                    const data = await s3.upload(uploadParams).promise();
                    console.log(`Successfully uploaded file ${fileName}: ${data.Location}`);
                    resolve(data.Location);
                } catch (err) {
                    console.error(`Error uploading file ${fileName} to S3:`, err);
                    reject(err);
                }
            };

            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                reject(error);
            };

            console.log('Starting to read file as ArrayBuffer');
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFiles = async (files) => {
        let uploadedFilesCount = 0;
        let validFilesCount = 0;
        let s3Urls = instance.data.s3Urls || [];
        let existingFiles = instance.data.files || [];

        instance.publishState('selected_files_count', files.length);

        console.log("Files to be uploaded:", files);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const check = allowedExtensions.includes(file.type);

            console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

            if ((maxSize >= Math.floor(file.size / 1024) && check) || 
                (maxSize >= Math.floor(file.size / 1024) && allowedExtensions.length === 0)) {
                validFilesCount++;
                try {
                    const url = await uploadFileToS3(file);
                    s3Urls.push(url);
                    existingFiles.push(file);
                    console.log(`Uploaded file URL: ${url}`);
                    uploadedFilesCount++;
                    instance.publishState('uploaded_files_count', uploadedFilesCount);
                } catch (error) {
                    console.error(`Failed to upload file ${file.name}:`, error);
                    instance.publishState('error', `Failed to upload file ${file.name}`);
                }
            } else {
                if (!check && maxSize < Math.floor(file.size / 1024) && allowedExtensions.length > 0) {
                    instance.data.size_type = instance.data.size_type || [];
                    instance.data.size_type.push(file.name);
                    instance.publishState('size_type', instance.data.size_type);
                } else if (!check && allowedExtensions.length > 0) {
                    instance.data.type = instance.data.type || [];
                    instance.data.type.push(file.name);
                    instance.publishState('type', instance.data.type);
                } else if (maxSize < Math.floor(file.size / 1024)) {
                    instance.data.size = instance.data.size || [];
                    instance.data.size.push(file.name);
                    instance.publishState('size', instance.data.size);
                }
            }
        }

        instance.data.s3Urls = s3Urls;
        instance.data.files = existingFiles;
        instance.publishState('final_files_count', s3Urls.length);
        instance.publishState('s3_urls', s3Urls);
        instance.publishState('files', existingFiles.map(file => file.name));
        console.log('Final s3Urls:', s3Urls);
    };

    // Create and handle file input for manual selection
    var input = document.createElement("input");
    input.setAttribute('type', 'file');
    input.setAttribute('accept', allowedExtensions.join(','));
    input.setAttribute('multiple', '');

    // Append the input to the body to ensure it is part of the DOM
    document.body.appendChild(input);

    input.addEventListener('change', async function(ev) {
        var files = ev.target.files;
        let newFiles = []; // Initialize the new files array

        // Store the selected files in instance.data.files
        for (let i = 0; i < files.length; i++) {
            newFiles.push(files[i]);
        }

        console.log("Selected files:", newFiles);

        await handleFiles(newFiles);

        // Remove the input element from the DOM after use
        document.body.removeChild(input);
    });

    // Click the input to open the user's device storage
    input.click();
}
