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

    const uploadFileToS3 = async (file) => {
        const s3 = new AWS.S3();
        const fileName = file.name;
        const fileKey = `${userId}/${unixTimeStamp}/${fileName}`;

        const uploadParams = {
            Bucket: bucketName,
            Key: fileKey,
            Body: file
        };

        try {
            const data = await s3.upload(uploadParams).promise(); // Use promise() to make it awaitable
            console.log(`Successfully uploaded file ${fileName}: ${data.Location}`);
            return data.Location;
        } catch (err) {
            console.error(`Error uploading file ${fileName} to S3:`, err);
            throw err;
        }
    };

    const handleFiles = async (files) => {
        let validFilesCount = 0;
        const s3Urls = instance.data.s3Urls || [];
        const existingFiles = instance.data.files || [];
        const validTypes = allowedExtensions;

        console.log("Files to be uploaded:", files);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const check = validTypes.includes(file.type);

            console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

            if ((maxSize >= Math.floor(file.size / 1024) && check) || 
                (maxSize >= Math.floor(file.size / 1024) && allowedExtensions.length === 0)) {
                validFilesCount++;
                try {
                    const url = await uploadFileToS3(file);
                    s3Urls.push(url);
                    existingFiles.push(file);
                    console.log(`Uploaded file URL: ${url}`);
                } catch (error) {
                    console.error(`Failed to upload file ${file.name}:`, error);
                    instance.publishState('upload_error', `Failed to upload file ${file.name}`);
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
        instance.publishState('uploaded_files_count', validFilesCount);
        instance.publishState('s3_urls', s3Urls);
        instance.publishState('files', existingFiles.map(file => file.name));
        console.log('Final s3Urls:', s3Urls);
    };

    // Add dropzone functionality
    $(document).ready(function() {
        const dropArea = document.getElementById(properties.id);

        if (dropArea) {
            dropArea.addEventListener('dragover', function(ev) {
                ev.preventDefault();
                instance.publishState('dragover', true);
                console.log('Dragover event');
            });

            dropArea.addEventListener('dragleave', function(ev) {
                ev.preventDefault();
                instance.publishState('dragover', false);
                console.log('Dragleave event');
            });

            dropArea.addEventListener('drop', function(ev) {
                ev.preventDefault();
                instance.publishState('dragover', false);
                console.log('Drop event');

                if (ev.dataTransfer.items) {
                    let files = [];
                    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                        if (ev.dataTransfer.items[i].kind === 'file') {
                            let file = ev.dataTransfer.items[i].getAsFile();
                            files.push(file);
                        }
                    }
                    handleFiles(files);
                } else {
                    handleFiles(ev.dataTransfer.files);
                }
            });
        }
    });
}
