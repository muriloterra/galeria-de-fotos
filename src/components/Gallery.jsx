import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2, Type } from "lucide-react";

const initialImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=90",
    category: "Nature",
    title: "Mountain Peak",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=90",
    category: "Landscape",
    title: "Valley Fog",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1600&q=90",
    category: "Portrait",
    title: "Urban Style",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=90",
    category: "Nature",
    title: "Forest Mist",
  },
];

export default function Gallery() {
  const [images, setImages] = useState(initialImages);
  const [selectedId, setSelectedId] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 }); // Store position at start of drag

  const fileInputRef = useRef(null);
  const addInputRef = useRef(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [tempData, setTempData] = useState({
    src: "",
    title: "",
    category: "",
  });

  const handleSaveMetadata = () => {
    if (modalMode === "add") {
      const newImage = {
        id:
          images.length > 0 ? Math.max(...images.map((img) => img.id)) + 1 : 1,
        src: tempData.src,
        category: tempData.category || "Upload",
        title: tempData.title || "New Capture",
      };
      setImages((prev) => [...prev, newImage]);
    } else {
      setImages((prev) =>
        prev.map((img) =>
          img.id === selectedId
            ? { ...img, title: tempData.title, category: tempData.category }
            : img,
        ),
      );
    }
    setShowModal(false);
  };

  const handleEditMetadataClick = () => {
    const img = images.find((i) => i.id === selectedId);
    if (img) {
      setTempData({ src: img.src, title: img.title, category: img.category });
      setModalMode("edit");
      setShowModal(true);
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      setImages((prev) => prev.filter((img) => img.id !== selectedId));
      setSelectedId(null);
      setScale(1);
      setPosition({ x: 0, y: 0 }); // Reset position on delete
    }
  };

  const handleEditClick = () => {
    fileInputRef.current.click();
  };

  const handleAddClick = () => {
    addInputRef.current.click();
  };

  const handleAddFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
        return;
      }
      const newUrl = URL.createObjectURL(file);
      setTempData({ src: newUrl, title: "", category: "" });
      setModalMode("add");
      setShowModal(true);
      event.target.value = ""; // Reset input
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && selectedId) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
        return;
      }
      const newUrl = URL.createObjectURL(file);
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === selectedId ? { ...img, src: newUrl } : img,
        ),
      );
    }
  };

  const [containerNode, setContainerNode] = useState(null);

  // Helper: Clamp position to viewport boundaries
  const clampPosition = (x, y, currentScale, containerRect) => {
    const maxX = (containerRect.width * currentScale - containerRect.width) / 2;
    const maxY =
      (containerRect.height * currentScale - containerRect.height) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  useEffect(() => {
    if (!containerNode) return;

    const handleWheel = (e) => {
      e.preventDefault();

      const newScale = Math.min(Math.max(1, scale - e.deltaY * 0.001), 4);
      const scaleRatio = newScale / scale;

      // Get cursor position relative to the container center
      const rect = containerNode.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - rect.width / 2;
      const offsetY = e.clientY - rect.top - rect.height / 2;

      // Calculate new position to keep cursor point stationary
      const newX = offsetX - (offsetX - position.x) * scaleRatio;
      const newY = offsetY - (offsetY - position.y) * scaleRatio;

      // Calculate max allowed displacement using helper
      const clamped = clampPosition(newX, newY, newScale, rect);

      setScale(newScale);

      // If zooming out to 1, reset position to center
      if (newScale <= 1.01) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition(clamped);
      }
    };

    const handleMouseDown = (e) => {
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        positionStartRef.current = { ...position };
        e.preventDefault(); // Prevent text selection
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging && scale > 1) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        let targetX = positionStartRef.current.x + deltaX;
        let targetY = positionStartRef.current.y + deltaY;

        // Clamp while dragging using helper
        const rect = containerNode.getBoundingClientRect();
        const clamped = clampPosition(targetX, targetY, scale, rect);

        setPosition(clamped);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Attach wheel listener to container
    containerNode.addEventListener("wheel", handleWheel, { passive: false });

    // Attach drag listeners to window to catch movements outside text
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    containerNode.addEventListener("mousedown", handleMouseDown);

    return () => {
      containerNode.removeEventListener("wheel", handleWheel);
      containerNode.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerNode, scale, position, isDragging]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showModal) {
          setShowModal(false);
        } else {
          setSelectedId(null);
          setScale(1);
          setPosition({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  const selectedImage = images.find((img) => img.id === selectedId);

  return (
    <>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 place-content-center">
        {images.map((image) => (
          <motion.div
            layoutId={`card-container-${image.id}`}
            key={image.id}
            onClick={() => {
              setSelectedId(image.id);
              setScale(1);
            }}
            className="group relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl bg-stone-900 aspect-[3/4] isolation-isolate"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Wrapper that scales both image and overlay together */}
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
              <motion.img
                layoutId={`card-image-${image.id}`}
                src={image.src}
                alt={image.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Plus className="text-white w-8 h-8 sm:w-10 sm:h-10 transform scale-75 group-hover:scale-100 transition-transform duration-300" />
              </div>
            </div>
            <motion.div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-white font-medium text-base sm:text-lg">
                {image.title}
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm">
                {image.category}
              </p>
            </motion.div>
          </motion.div>
        ))}

        <motion.div
          onClick={handleAddClick}
          className="group relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl bg-stone-900 border-2 border-dashed border-stone-800 hover:border-white/50 transition-colors duration-300 aspect-[3/4] flex flex-col items-center justify-center p-6 gap-4"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors duration-300">
            <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors duration-300" />
          </div>
          <span className="text-stone-400 group-hover:text-white font-medium transition-colors duration-300">
            Add Photo
          </span>
          <input
            type="file"
            ref={addInputRef}
            onChange={handleAddFileChange}
            accept=".png, .jpg, .jpeg, .webp"
            className="hidden"
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedId && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSelectedId(null);
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-sm"
          >
            <motion.div
              ref={setContainerNode}
              layoutId={`card-container-${selectedId}`}
              className="relative w-auto max-w-[95vw] overflow-hidden rounded-xl sm:rounded-2xl bg-stone-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden cursor-move">
                <motion.img
                  layoutId={`card-image-${selectedId}`}
                  src={selectedImage.src}
                  style={{ scale, x: position.x, y: position.y }}
                  className={`w-auto max-h-[60vh] sm:max-h-[75vh] lg:max-h-[85vh] object-contain bg-black ${
                    scale > 1
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-zoom-in"
                  }`}
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".png, .jpg, .jpeg, .webp"
                  className="hidden"
                />
              </div>

              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2">
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-colors"
                  title="Delete Image"
                >
                  <Trash2 size={20} className="sm:w-6 sm:h-6" />
                </button>

                <button
                  onClick={handleEditMetadataClick}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
                  title="Edit Info"
                >
                  <Type size={20} className="sm:w-6 sm:h-6" />
                </button>

                <button
                  onClick={handleEditClick}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
                  title="Change Image"
                >
                  <Pencil size={20} className="sm:w-6 sm:h-6" />
                </button>

                <button
                  onClick={() => {
                    setSelectedId(null);
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"
              >
                <h2 className="text-xl sm:text-2xl font-light text-white mb-1">
                  {selectedImage.title}
                </h2>
                <p className="text-stone-400 text-sm">
                  {selectedImage.category}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-stone-900 p-6 rounded-2xl w-full max-w-md border border-stone-800 shadow-xl"
            >
              <h3 className="text-xl text-white font-medium mb-4">
                {modalMode === "add" ? "Add New Photo" : "Edit Details"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-stone-400 text-sm mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={tempData.title}
                    onChange={(e) =>
                      setTempData({ ...tempData, title: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSaveMetadata()}
                    placeholder="e.g. Mountain View"
                    className="w-full bg-black/50 border border-stone-700 rounded-lg p-2 text-white focus:outline-none focus:border-white/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 text-sm mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={tempData.category}
                    onChange={(e) =>
                      setTempData({ ...tempData, category: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSaveMetadata()}
                    placeholder="e.g. Nature"
                    className="w-full bg-black/50 border border-stone-700 rounded-lg p-2 text-white focus:outline-none focus:border-white/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMetadata}
                  className="px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-stone-200 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
