var createScene = async function () {

    // Creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // Creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1, -5), scene);

    // Cargets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // Attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // Creates lights
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    var dirLight = new BABYLON.DirectionalLight("dirlight", new BABYLON.Vector3(0, -1, -0.5), scene);
    dirLight.position = new BABYLON.Vector3(0, 5, -5);


    // AR availability check and GUI in non-AR mode
    let arAvailable = await BABYLON.WebXRSessionManager.IsSessionSupportedAsync('immersive-ar');

    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "FullscreenUI"
    );

    var rectangle = new BABYLON.GUI.Rectangle("rect");
    rectangle.background = "black";
    rectangle.color = "blue";
    rectangle.width = "80%";
    rectangle.height = "50%";

    advancedTexture.addControl(rectangle);
    var nonXRPanel = new BABYLON.GUI.StackPanel();
    rectangle.addControl(nonXRPanel);

    if (!arAvailable) {
        const text1 = new BABYLON.GUI.TextBlock("text1");
        text1.fontFamily = "Helvetica";
        text1.textWrapping = true;
        text1.text = "AR not supported for this device";
        text1.color = "white";
        text1.fontSize = "20px";
        text1.height = "100px"

        text1.paddingLeft = "10px";
        text1.paddingRight = "10px";
        nonXRPanel.addControl(text1);

        return scene;
    } else {
        const text1 = new BABYLON.GUI.TextBlock("text1");
        text1.fontFamily = "Helvetica";
        text1.textWrapping = true;
        text1.text = "click on the AR icon in bottom right corner to enter AR world";
        text1.color = "white";
        text1.fontSize = "14px";
        text1.height = "400px"

        text1.paddingLeft = "10px";
        text1.paddingRight = "10px";
        nonXRPanel.addControl(text1);
    }

    // Create the WebXR Experience Helper for an AR Session (it initializes the XR scene, creates an XR Camera, 
    // initialize the features manager, create an HTML UI button to enter XR,...)
    var xr = await scene.createDefaultXRExperienceAsync({
        uiOptions: {
            sessionMode: "immersive-ar",
            referenceSpaceType: "local-floor",
            onError: (error) => {
                alert(error);
            }
        },
        optionalFeatures: true
    });

    //Hide/Show GUI depending of AR/nonAR mode
    xr.baseExperience.sessionManager.onXRSessionInit.add(() => {
        rectangle.isVisible = false;
        panel.isVisible = true;
    })
    xr.baseExperience.sessionManager.onXRSessionEnded.add(() => {
        rectangle.isVisible = true;
        panel.isVisible = false;
    })

    var panel = new BABYLON.GUI.StackPanel();
    panel.isVisible = false;
    panel.alpha = 0.75;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.paddingBottomInPixels = 40;
    advancedTexture.addControl(panel)


    // Get the Feature Manager and from it the HitTesting fearture 
    const fm = xr.baseExperience.featuresManager;
    const xrTest = fm.enableFeature(BABYLON.WebXRHitTest.Name, "latest");

    // Load the 3D model to be added in AR
    var model = await BABYLON.SceneLoader.ImportMeshAsync("", "https://assets.babylonjs.com/meshes/", "SheenChair.glb", scene);
    var b = model.meshes[0];

    //Clone the mesh to create a ghost mesh that will used for positionning
    var bGhost = b.clone("bModel");
    for (var child of bGhost.getChildMeshes()) {
        child.material = new BABYLON.StandardMaterial("mat");
        child.material.alpha = 0.25;
        // child.material.diffuseTexture = new BABYLON.Texture("textures/speckles.jpg");
    }

    //Ensure model and ghost are not visible at the beginning
    b.setEnabled(false);
    bGhost.setEnabled(false);

    // Update the position/rotation of the ghost model with HitTest information
    var hitTest;
    xrTest.onHitTestResultObservable.add((results) => {
        if (results.length) {
            bGhost.setEnabled(true);
            hitTest = results[0];
            hitTest.transformationMatrix.decompose(undefined, bGhost.rotationQuaternion, bGhost.position);
        } else {
            bGhost.setEnabled(false);
            hitTest = undefined;
        }
    });

    // When touching the screen, display final model at the hitTest position
    scene.onPointerDown = (evt, pickInfo) => {
        if (hitTest && xr.baseExperience.state === BABYLON.WebXRState.IN_XR) {
            hitTest.transformationMatrix.decompose(undefined, b.rotationQuaternion, b.position);
            b.setEnabled(true);
        }
    }

    return scene;

};