const video = document.getElementById("video");

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
]).then(mulaicamera).then(faceRecognition);


function mulaicamera() {
    navigator.mediaDevices.getUserMedia(
        {
            "video": true,
            Audio: false
        }).then((stream) => {
            video.srcObject = stream;
        }).catch((error) => {
            console.error(error);
        })
}

function getLabeledFaceDescriptions() {
    const labels = ["ira", "nuhi", "sahrul"]
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 2; i++) {
                const image = await faceapi.fetchImage(`./labels/${label}/${1}.jpeg`)
                const detections = await faceapi
                    .detectSingleFace(image)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })

    );
}

async function faceRecognition() {

    video.addEventListener("play", async () => {
        const labeledFaceDescriptors = await getLabeledFaceDescriptions();
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
        console.log("playing");
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);

        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

            const results = resizedDetections.map((d) => {

                return faceMatcher.findBestMatch(d.descriptor);
            });

            results.forEach((result, i) => {

                const box = resizedDetections[i].detection.box;
                const drawbox = new faceapi.draw.DrawBox(box, { label: result });
                drawbox.draw(canvas);
            });
        }, 100);
    });

}

