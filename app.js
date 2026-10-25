const supabaseClient = supabase.createClient(
    "https://mlxjobwhdvcxzmmxulmp.supabase.co",
    "sb_publishable_5S397aeTfAw2-FpK01RoXQ_x6cUgyeV"
);

// TAMAÑO MÁXIMO (50 MB)
const MAX_FILE_SIZE = 200 * 1024 * 1024;

// SUBIR ARCHIVO
async function uploadFile() {

    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Selecciona un archivo");
        return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {

        alert(
            `El archivo pesa ${(file.size / 1024 / 1024).toFixed(2)} MB\n\n` +
            `El límite permitido es de 50 MB`
        );

        return;
    }

    const fileName = Date.now() + "_" + file.name;

    // Subir al Storage
    const { error: uploadError } = await supabaseClient.storage
        .from("archivos")
        .upload(fileName, file);

    if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
    }

    // Guardar en BD
    const { error: dbError } = await supabaseClient
        .from("archivos")
        .insert([
            {
                nombre: file.name,
                ruta: fileName,
                tamaño: file.size,
                tipo: file.type
            }
        ]);

    if (dbError) {
        console.error(dbError);
        alert(dbError.message);
        return;
    }

    alert("Archivo subido correctamente");

    document.getElementById("fileInput").value = "";

    listarArchivos();
}

// LISTAR ARCHIVOS
async function listarArchivos() {

    const { data, error } = await supabaseClient
        .from("archivos")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const filesDiv = document.getElementById("files");

    filesDiv.innerHTML = "";

    data.forEach(file => {

        const { data: urlData } = supabaseClient.storage
            .from("archivos")
            .getPublicUrl(file.ruta);

        filesDiv.innerHTML += `
            <div class="file">

                <strong>📄 ${file.nombre}</strong><br>

                ${(file.tamaño / 1024).toFixed(2)} KB
                <br>

                <small>${file.tipo || "Desconocido"}</small>

                <br><br>

                <button onclick="descargarArchivo('${urlData.publicUrl}','${file.nombre}')">
                    ⬇ Descargar
                </button>

                <button onclick="eliminarArchivo('${file.nombre}','${file.ruta}')">
                    🗑 Eliminar
                </button>

            </div>
        `;
    });
}

// DESCARGAR ARCHIVO
function descargarArchivo(url, nombre) {

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombre;
    enlace.target = "_blank";

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);
}

// ELIMINAR ARCHIVO
async function eliminarArchivo(nombre, ruta) {

    if (!confirm(`¿Deseas eliminar "${nombre}"?`)) {
        return;
    }

    const { error: storageError } = await supabaseClient.storage
        .from("archivos")
        .remove([ruta]);

    if (storageError) {
        console.error(storageError);
        alert(storageError.message);
        return;
    }

    const { error: dbError } = await supabaseClient
        .from("archivos")
        .delete()
        .eq("ruta", ruta);

    if (dbError) {
        console.error(dbError);
        alert(dbError.message);
        return;
    }

    listarArchivos();
}

// CARGAR ARCHIVOS AL INICIAR
window.onload = function () {
    listarArchivos();
};
