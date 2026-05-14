import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  Info as InfoIcon,
  ImagePlus,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import "../styles/ProductsPage.css";

type ProductStatus = "Available" | "Reserved" | "Sold" | "Hidden";
type ProductStatusFr = "Disponible" | "Réservé" | "Vendu" | "Masqué";
type FormStatus = ProductStatus | ProductStatusFr;

type ToastKind = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

class ApiRequestError extends Error {
  status?: number;
  responseBody?: unknown;
  payload?: unknown;

  constructor(
    message: string,
    options?: { status?: number; responseBody?: unknown; payload?: unknown }
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.responseBody = options?.responseBody;
    this.payload = options?.payload;
  }
}

type ErrorModalState = {
  status?: number;
  message: string;
  details?: string;
};

type ConfirmModalState = {
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm: () => Promise<void>;
};

type FetchProductsOptions = {
  pageValue?: number;
  searchValue?: string;
  statusValue?: string;
  activeValue?: string;
  featuredValue?: string;
};

type ProductImage = {
  id: number;
  productId: number;
  imageUrl: string;
  sortOrder: number;
  isMain: boolean;
};

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  type?: string;
  technique?: string;
  region?: string;
  material?: string;
  colors?: string;
  lengthCm?: number;
  widthCm?: number;
  dimensions?: string;
  weightKg?: number;
  ageYears?: number;
  condition?: string;
  density?: string;
  shape?: string;
  style?: string;
  isHandmade?: boolean;
  isUniquePiece?: boolean;
  usageSpace?: string;
  careInstructions?: string;
  shortStory?: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  status: ProductStatus;
  isPriceOnRequestOnlyInTunisia: boolean;
  mainImageUrl?: string | null;
  images: ProductImage[];
  createdAt: string;
};

type ProductsResponse = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: AdminProduct[];
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  type: string;
  technique: string;
  region: string;
  material: string;
  colors: string;
  lengthCm: string;
  widthCm: string;
  weightKg: string;
  ageYears: string;
  condition: string;
  density: string;
  shape: string;
  style: string;
  usageSpace: string;
  careInstructions: string;
  shortStory: string;
  price: string;
  stock: string;
  status: FormStatus;
  isActive: boolean;
  isFeatured: boolean;
  isHandmade: boolean;
  isUniquePiece: boolean;
  isPriceOnRequestOnlyInTunisia: boolean;
};

const API_BASE_URL = "http://localhost:5163";

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  category: "",
  type: "",
  technique: "",
  region: "",
  material: "",
  colors: "",
  lengthCm: "",
  widthCm: "",
  weightKg: "",
  ageYears: "",
  condition: "",
  density: "",
  shape: "",
  style: "",
  usageSpace: "",
  careInstructions: "",
  shortStory: "",
  price: "0",
  stock: "1",
  status: "Available",
  isActive: true,
  isFeatured: false,
  isHandmade: true,
  isUniquePiece: true,
  isPriceOnRequestOnlyInTunisia: false,
};

const statusLabels: Record<ProductStatus, string> = {
  Available: "Disponible",
  Reserved: "Réservé",
  Sold: "Vendu",
  Hidden: "Masqué",
};

const frToApiStatusMap: Record<ProductStatusFr, ProductStatus> = {
  Disponible: "Available",
  "Réservé": "Reserved",
  Vendu: "Sold",
  "Masqué": "Hidden",
};

function toApiStatus(status: FormStatus): ProductStatus {
  if (status in frToApiStatusMap) {
    return frToApiStatusMap[status as ProductStatusFr];
  }
  return status as ProductStatus;
}

function extractBackendMessage(rawBody: unknown, fallback: string) {
  if (!rawBody) return fallback;
  if (typeof rawBody === "string" && rawBody.trim()) return rawBody;
  if (typeof rawBody === "object") {
    const body = rawBody as Record<string, unknown>;
    const keys = ["message", "error", "detail", "title"];
    for (const key of keys) {
      const value = body[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return fallback;
}

async function parseErrorResponse(response: Response, fallback: string) {
  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    status: response.status,
    body,
    message: extractBackendMessage(body, fallback),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [active, setActive] = useState("");
  const [featured, setFeatured] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [viewProduct, setViewProduct] = useState<AdminProduct | null>(null);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [errorModal, setErrorModal] = useState<ErrorModalState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const toastTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const didInitDebouncedSearchRef = useRef(false);

  const token = useMemo(
    () =>
      localStorage.getItem("artisan_admin_token") ||
      localStorage.getItem("admin_token") ||
      localStorage.getItem("artisan_access_token") ||
      "",
    []
  );

  const authHeaders = { Authorization: `Bearer ${token}` };

  const jsonHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const removeToast = useCallback((id: number) => {
    const existingTimer = toastTimersRef.current[id];
    if (existingTimer) {
      clearTimeout(existingTimer);
      delete toastTimersRef.current[id];
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, kind, message }]);
      toastTimersRef.current[id] = setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const showSuccessToast = useCallback((message: string) => {
    pushToast("success", message);
  }, [pushToast]);

  const showErrorToast = useCallback((message: string) => {
    pushToast("error", message);
  }, [pushToast]);

  const showInfoToast = useCallback((message: string) => {
    pushToast("info", message);
  }, [pushToast]);

  const showWarningToast = useCallback((message: string) => {
    pushToast("warning", message);
  }, [pushToast]);

  const openErrorModal = useCallback(
    (payload: { status?: number; message: string; details?: string }) => {
      setErrorModal(payload);
      showErrorToast(payload.message);
    },
    [showErrorToast]
  );

  useEffect(() => {
    return () => {
      Object.values(toastTimersRef.current).forEach((timer) => clearTimeout(timer));
      toastTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!confirmModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirmLoading) {
        setConfirmModal(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmModal, confirmLoading]);

  const getImageUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const fetchProducts = useCallback(async (options?: FetchProductsOptions) => {
    const pageToUse = options?.pageValue ?? page;
    const searchToUse = options?.searchValue ?? debouncedSearch;
    const statusToUse = options?.statusValue ?? status;
    const activeToUse = options?.activeValue ?? active;
    const featuredToUse = options?.featuredValue ?? featured;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(pageToUse),
        pageSize: "12",
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      if (searchToUse.trim()) params.append("search", searchToUse.trim());
      if (statusToUse) params.append("status", statusToUse);
      if (activeToUse) params.append("active", activeToUse);
      if (featuredToUse) params.append("featured", featuredToUse);

      const response = await fetch(`${API_BASE_URL}/api/admin/products?${params}`, {
        headers: authHeaders,
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Accès refusé. Connecte-toi avec un compte admin.");
      }

      if (!response.ok) throw new Error("Impossible de charger les produits.");

      const data: ProductsResponse = await response.json();

      setProducts(data.items);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [active, authHeaders, debouncedSearch, featured, page, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!didInitDebouncedSearchRef.current) {
      didInitDebouncedSearchRef.current = true;
      return;
    }

    setPage(1);
    fetchProducts({
      pageValue: 1,
      searchValue: debouncedSearch,
      statusValue: status,
      activeValue: active,
      featuredValue: featured,
    });
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts({
      pageValue: page,
      searchValue: debouncedSearch,
      statusValue: status,
      activeValue: active,
      featuredValue: featured,
    });
  }, [page]);

  const updateForm = (key: keyof ProductForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !editingProduct ? { slug: slugify(String(value)) } : {}),
    }));
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingProduct(product);
    setSelectedFiles([]);

    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      category: product.category || "",
      type: product.type || "",
      technique: product.technique || "",
      region: product.region || "",
      material: product.material || "",
      colors: product.colors || "",
      lengthCm: product.lengthCm ? String(product.lengthCm) : "",
      widthCm: product.widthCm ? String(product.widthCm) : "",
      weightKg: product.weightKg ? String(product.weightKg) : "",
      ageYears: product.ageYears ? String(product.ageYears) : "",
      condition: product.condition || "",
      density: product.density || "",
      shape: product.shape || "",
      style: product.style || "",
      usageSpace: product.usageSpace || "",
      careInstructions: product.careInstructions || "",
      shortStory: product.shortStory || "",
      price: String(product.price || 0),
      stock: String(product.stock || 0),
      status: product.status || "Available",
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isHandmade: Boolean(product.isHandmade),
      isUniquePiece: Boolean(product.isUniquePiece),
      isPriceOnRequestOnlyInTunisia: product.isPriceOnRequestOnlyInTunisia,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingProduct(null);
    setSelectedFiles([]);
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(e.target.files || []));
  };

const buildPayload = () => ({
  name: form.name.trim(),
  slug: form.slug.trim(),

  description: form.description || "",
  category: form.category || "",
  type: form.type || "",
  technique: form.technique || "",
  region: form.region || "",
  material: form.material || "",
  colors: form.colors || "",

  lengthCm: form.lengthCm ? Number(form.lengthCm) : null,
  widthCm: form.widthCm ? Number(form.widthCm) : null,
  weightKg: form.weightKg ? Number(form.weightKg) : null,
  ageYears: form.ageYears ? Number(form.ageYears) : null,

  condition: form.condition || "",
  density: form.density || "",
  shape: form.shape || "",
  style: form.style || "",

  isHandmade: form.isHandmade,
  isUniquePiece: form.isUniquePiece,

  usageSpace: form.usageSpace || "",
  careInstructions: form.careInstructions || "",
  shortStory: form.shortStory || "",

  price: Number(form.price || 0),
  stock: Number(form.stock || 0),

  isActive: form.isActive,
  isFeatured: form.isFeatured,
  isPriceOnRequestOnlyInTunisia: form.isPriceOnRequestOnlyInTunisia,

  mainImageUrl: editingProduct?.mainImageUrl || "",

  images:
    editingProduct?.images?.map((img) => ({
      imageUrl: img.imageUrl,
      sortOrder: img.sortOrder,
      isMain: img.isMain,
    })) || [],
});

  const uploadImages = async (productId: number) => {
    if (selectedFiles.length === 0) return;
    showInfoToast("Upload des images en cours...");
    setUploadingImages(true);

    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const data = new FormData();
        data.append("file", selectedFiles[index]);
        data.append("isMain", String(index === 0));

        const response = await fetch(
          `${API_BASE_URL}/api/admin/products/${productId}/images/upload`,
          {
            method: "POST",
            headers: authHeaders,
            body: data,
          }
        );

        if (!response.ok) {
          const apiError = await parseErrorResponse(
            response,
            "Produit sauvegardé, mais erreur pendant l’upload image."
          );
          console.error("PRODUCT IMAGE UPLOAD ERROR", {
            status: apiError.status,
            responseBody: apiError.body,
            payload: { productId, fileName: selectedFiles[index].name },
          });
          throw new ApiRequestError(apiError.message, {
            status: apiError.status,
            responseBody: apiError.body,
            payload: { productId, fileName: selectedFiles[index].name },
          });
        }
      }
      showSuccessToast("Images uploadées avec succès.");
    } finally {
      setUploadingImages(false);
    }
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.slug.trim()) {
      showWarningToast("Le nom et le slug sont obligatoires.");
      return;
    }

    const payload = buildPayload();
    const mappedStatus = toApiStatus(form.status);

    try {
      setSaving(true);

      if (editingProduct) {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/products/${editingProduct.id}`,
          {
            method: "PUT",
            headers: jsonHeaders,
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const apiError = await parseErrorResponse(
            response,
            "Erreur pendant la modification."
          );

          console.error("PRODUCT UPDATE ERROR", {
            status: apiError.status,
            responseBody: apiError.body,
            payload,
          });

          throw new ApiRequestError(apiError.message, {
            status: apiError.status,
            responseBody: apiError.body,
            payload,
          });
        }

        await fetch(`${API_BASE_URL}/api/admin/products/${editingProduct.id}/status`, {
          method: "PATCH",
          headers: jsonHeaders,
          body: JSON.stringify({ status: mappedStatus }),
        });

        await uploadImages(editingProduct.id);
        showSuccessToast("Produit modifié avec succès.");
      } else {
        const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const apiError = await parseErrorResponse(response, "Erreur pendant la création.");
          console.error("PRODUCT CREATE ERROR", {
            status: apiError.status,
            responseBody: apiError.body,
            payload,
          });
          throw new ApiRequestError(apiError.message, {
            status: apiError.status,
            responseBody: apiError.body,
            payload,
          });
        }

        const created = await response.json();

        await fetch(`${API_BASE_URL}/api/admin/products/${created.id}/status`, {
          method: "PATCH",
          headers: jsonHeaders,
          body: JSON.stringify({ status: mappedStatus }),
        });

        await uploadImages(created.id);
        showSuccessToast("Produit créé avec succès.");
      }

      await fetchProducts();
      closeModal();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        console.error("PRODUCT SAVE CATCH", {
          status: err.status,
          responseBody: err.responseBody,
          payload: err.payload ?? payload,
        });
      } else {
        console.error("PRODUCT SAVE CATCH", { error: err, payload });
      }
      openErrorModal({
        status: err instanceof ApiRequestError ? err.status : undefined,
        message: err instanceof Error ? err.message : "Erreur pendant la sauvegarde.",
        details:
          err instanceof ApiRequestError && err.responseBody
            ? JSON.stringify(err.responseBody, null, 2)
            : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const hideProduct = async (id: number) => {
    try {
      setActionLoadingId(id);

      const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/status`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ status: "Hidden" as ProductStatus }),
      });

      if (!response.ok) {
        const apiError = await parseErrorResponse(response, "Erreur pendant la suppression.");
        console.error("PRODUCT HIDE ERROR", {
          status: apiError.status,
          responseBody: apiError.body,
          payload: { id, status: "Hidden" },
        });
        throw new ApiRequestError(apiError.message, {
          status: apiError.status,
          responseBody: apiError.body,
          payload: { id, status: "Hidden" },
        });
      }

      await fetchProducts();
      showSuccessToast("Produit masqué avec succès.");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        console.error("PRODUCT HIDE CATCH", {
          status: err.status,
          responseBody: err.responseBody,
          payload: err.payload ?? { id, status: "Hidden" },
        });
      }
      openErrorModal({
        status: err instanceof ApiRequestError ? err.status : undefined,
        message: err instanceof Error ? err.message : "Erreur pendant la suppression.",
        details:
          err instanceof ApiRequestError && err.responseBody
            ? JSON.stringify(err.responseBody, null, 2)
            : undefined,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/images/${imageId}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        const apiError = await parseErrorResponse(
          response,
          "Erreur pendant la suppression de l’image."
        );
        throw new ApiRequestError(apiError.message, {
          status: apiError.status,
          responseBody: apiError.body,
          payload: { imageId, productId: editingProduct.id },
        });
      }

      const fresh = await fetch(
        `${API_BASE_URL}/api/admin/products/${editingProduct.id}`,
        { headers: authHeaders }
      );

      const data = await fresh.json();
      setEditingProduct(data);
      openEditModal(data);
      await fetchProducts();
      showSuccessToast("Image supprimée avec succès.");
    } catch (err) {
      console.error("PRODUCT IMAGE DELETE ERROR", {
        error: err,
        status: (err as { status?: number })?.status,
        payload: { imageId, productId: editingProduct.id },
      });
      openErrorModal({
        status: err instanceof ApiRequestError ? err.status : undefined,
        message:
          err instanceof Error ? err.message : "Erreur pendant la suppression de l’image.",
        details:
          err instanceof ApiRequestError && err.responseBody
            ? JSON.stringify(err.responseBody, null, 2)
            : undefined,
      });
    }
  };

  const setMainImage = async (imageId: number) => {
    if (!editingProduct) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/products/${editingProduct.id}/images/${imageId}/main`,
        {
          method: "PATCH",
          headers: authHeaders,
        }
      );

      if (!response.ok) {
        const apiError = await parseErrorResponse(
          response,
          "Erreur pendant la mise en image principale."
        );
        throw new ApiRequestError(apiError.message, {
          status: apiError.status,
          responseBody: apiError.body,
          payload: { imageId, productId: editingProduct.id },
        });
      }

      const fresh = await fetch(
        `${API_BASE_URL}/api/admin/products/${editingProduct.id}`,
        { headers: authHeaders }
      );

      const data = await fresh.json();
      setEditingProduct(data);
      openEditModal(data);
      await fetchProducts();
      showSuccessToast("Image principale mise à jour.");
    } catch (err) {
      console.error("PRODUCT MAIN IMAGE ERROR", {
        error: err,
        status: (err as { status?: number })?.status,
        payload: { imageId, productId: editingProduct.id },
      });
      openErrorModal({
        status: err instanceof ApiRequestError ? err.status : undefined,
        message:
          err instanceof Error ? err.message : "Erreur pendant la mise en image principale.",
        details:
          err instanceof ApiRequestError && err.responseBody
            ? JSON.stringify(err.responseBody, null, 2)
            : undefined,
      });
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchProducts({
      pageValue: 1,
      searchValue: search,
      statusValue: status,
      activeValue: active,
      featuredValue: featured,
    });
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setActive("");
    setFeatured("");
    setPage(1);
    fetchProducts({
      pageValue: 1,
      searchValue: "",
      statusValue: "",
      activeValue: "",
      featuredValue: "",
    });
  };

  const openHideConfirm = (product: AdminProduct) => {
    setConfirmModal({
      title: "Masquer ce produit ?",
      description: `Le produit "${product.name}" passera au statut Masqué pour eviter une suppression destructive.`,
      confirmLabel: "Confirmer",
      loadingLabel: "Masquage en cours...",
      tone: "danger",
      onConfirm: async () => {
        await hideProduct(product.id);
      },
    });
  };

  const onConfirmModalAction = async () => {
    if (!confirmModal || confirmLoading) return;

    try {
      setConfirmLoading(true);
      await confirmModal.onConfirm();
    } finally {
      setConfirmLoading(false);
      setConfirmModal(null);
    }
  };

  const isSearchLoading = loading && search.trim().length > 0;

  return (
    <section className="admin-products-page">
      <div className="products-hero">
          

        <button className="products-primary-btn" type="button" onClick={openCreateModal}>
          <Plus size={18} />
          Nouveau produit
        </button>
      </div>

      <div className="products-toast-viewport" aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`products-toast products-toast-${toast.kind}`}
              initial={{ opacity: 0, x: 100, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <span className="products-toast-icon">{getToastIcon(toast.kind)}</span>
              <span>{toast.message}</span>
              <button type="button" onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="products-stats-grid">
        <div>
          <span>Total produits</span>
          <strong>{totalItems}</strong>
        </div>
        <div>
          <span>Résultats affichés</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Page actuelle</span>
          <strong>{page}/{totalPages}</strong>
        </div>
      </div>

      <div className="products-filter-card">
        <div className="products-search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, slug, catégorie, région..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyFilters();
              }
            }}
          />
          {search && (
            <button
              type="button"
              className="products-search-clear"
              aria-label="Vider la recherche"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setPage(1);
                fetchProducts({
                  pageValue: 1,
                  searchValue: "",
                  statusValue: status,
                  activeValue: active,
                  featuredValue: featured,
                });
              }}
            >
              <X size={14} />
            </button>
          )}
          {isSearchLoading && <span className="products-search-loading">Recherche en cours...</span>}
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="Available">Disponible</option>
          <option value="Reserved">Réservé</option>
          <option value="Sold">Vendu</option>
          <option value="Hidden">Masqué</option>
        </select>

        <select value={active} onChange={(e) => setActive(e.target.value)}>
          <option value="">Actif / inactif</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>

        <select value={featured} onChange={(e) => setFeatured(e.target.value)}>
          <option value="">Vedette / normal</option>
          <option value="true">Mis en avant</option>
          <option value="false">Non mis en avant</option>
        </select>

        <button type="button" onClick={applyFilters}>Filtrer</button>
        <button className="products-light-btn" type="button" onClick={resetFilters}>Reset</button>
      </div>

      {loading ? (
        <div className="products-grid products-grid-skeleton">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="product-admin-card product-admin-card-skeleton" key={`skeleton-${index}`}>
              <div className="product-admin-image product-skeleton-block" />
              <div className="product-admin-body">
                <div className="product-skeleton-line short" />
                <div className="product-skeleton-line" />
                <div className="product-skeleton-actions">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="products-error-card">{error}</div>
      ) : products.length === 0 ? (
        <div className="products-state-card">
          <Package size={34} />
          <p>Aucun produit trouvé.</p>
        </div>
      ) : (
        <motion.div className="products-grid" layout>
          {products.map((product) => (
            <motion.article
              className="product-admin-card"
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              whileHover={{ y: -6 }}
            >
              <div className="product-admin-image">
                {product.mainImageUrl ? (
                  <img src={getImageUrl(product.mainImageUrl)} alt={product.name} />
                ) : (
                  <Package size={30} />
                )}

                <span className={`product-status status-${product.status.toLowerCase()}`}>
                  {statusLabels[product.status]}
                </span>
              </div>

              <div className="product-admin-body">
                <h3>{product.name}</h3>
                <small>{product.slug}</small>

                <div className="product-admin-actions">
                  <button type="button" onClick={() => setViewProduct(product)}>
                    <Eye size={16} />
                    Voir détail
                  </button>

                  <button type="button" onClick={() => openEditModal(product)}>
                    <Pencil size={16} />
                    Modifier
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => openHideConfirm(product)}
                    disabled={actionLoadingId === product.id}
                  >
                    {actionLoadingId === product.id ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      <div className="products-pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Précédent
        </button>
        <span>Page {page} sur {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Suivant
        </button>
      </div>

      <AnimatePresence>
        {viewProduct && (
          <motion.div
            className="product-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="product-detail-modal"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
            >
              <button className="view-close" type="button" onClick={() => setViewProduct(null)}>
                <X size={20} />
              </button>

              <div className="detail-gallery">
                <div className="detail-main-image">
                  {viewProduct.mainImageUrl ? (
                    <img src={getImageUrl(viewProduct.mainImageUrl)} alt={viewProduct.name} />
                  ) : (
                    <Package size={46} />
                  )}
                </div>

                {viewProduct.images.length > 1 && (
                  <div className="detail-thumbs">
                    {viewProduct.images.slice(0, 5).map((img) => (
                      <img key={img.id} src={getImageUrl(img.imageUrl)} alt="" />
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-content">
                <div className="detail-title-row">
                  <div>
                    <span className={`product-status detail-status status-${viewProduct.status.toLowerCase()}`}>
                      {statusLabels[viewProduct.status]}
                    </span>
                    <h2>{viewProduct.name}</h2>
                    <p>{viewProduct.shortStory || viewProduct.description || "Aucune description disponible."}</p>
                  </div>

                  <div className="detail-price-box">
                    <span>Prix</span>
                    <strong>
                      {viewProduct.isPriceOnRequestOnlyInTunisia
                        ? "Sur demande"
                        : `${viewProduct.price} €`}
                    </strong>
                  </div>
                </div>

                <div className="detail-badges">
                  {viewProduct.isActive && <span>Actif</span>}
                  {viewProduct.isFeatured && <span>Vedette</span>}
                  {viewProduct.isHandmade && <span>Fait main</span>}
                  {viewProduct.isUniquePiece && <span>Pièce unique</span>}
                  {viewProduct.isPriceOnRequestOnlyInTunisia && <span>Prix Tunisie sur demande</span>}
                </div>

                <div className="detail-info-grid">
                  <Info label="Catégorie" value={viewProduct.category} />
                  <Info label="Type" value={viewProduct.type} />
                  <Info label="Région" value={viewProduct.region} />
                  <Info label="Matière" value={viewProduct.material} />
                  <Info label="Couleurs" value={viewProduct.colors} />
                  <Info label="Technique" value={viewProduct.technique} />
                  <Info label="Dimensions" value={viewProduct.dimensions || `${viewProduct.lengthCm || "-"} x ${viewProduct.widthCm || "-"} cm`} />
                  <Info label="Poids" value={viewProduct.weightKg ? `${viewProduct.weightKg} kg` : undefined} />
                  <Info label="Âge" value={viewProduct.ageYears ? `${viewProduct.ageYears} ans` : undefined} />
                  <Info label="État" value={viewProduct.condition} />
                  <Info label="Densité" value={viewProduct.density} />
                  <Info label="Forme" value={viewProduct.shape} />
                  <Info label="Style" value={viewProduct.style} />
                  <Info label="Espace conseillé" value={viewProduct.usageSpace} />
                  <Info label="Stock" value={String(viewProduct.stock)} />
                  <Info label="Créé le" value={formatDate(viewProduct.createdAt)} />
                </div>

                {(viewProduct.description || viewProduct.careInstructions) && (
                  <div className="detail-text-blocks">
                    {viewProduct.description && (
                      <div>
                        <h3>Description</h3>
                        <p>{viewProduct.description}</p>
                      </div>
                    )}

                    {viewProduct.careInstructions && (
                      <div>
                        <h3>Entretien</h3>
                        <p>{viewProduct.careInstructions}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="detail-actions">
                  <button type="button" onClick={() => {
                    setViewProduct(null);
                    openEditModal(viewProduct);
                  }}>
                    <Pencil size={17} />
                    Modifier ce produit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="product-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              className="product-modal"
              onSubmit={saveProduct}
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
            <div className="product-modal-header">
              <div>
                <span>{editingProduct ? "Modification produit" : "Nouveau produit"}</span>
                <h2>{editingProduct ? "Modifier la fiche produit" : "Ajouter un tapis"}</h2>
              </div>

              <button type="button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="product-modal-content">
              <div className="product-form-grid">
                <label>Nom du produit *<input value={form.name} onChange={(e) => updateForm("name", e.target.value)} /></label>
                <label>Slug *<input value={form.slug} onChange={(e) => updateForm("slug", e.target.value)} /></label>
                <label>Catégorie<input value={form.category} onChange={(e) => updateForm("category", e.target.value)} /></label>
                <label>Type<input value={form.type} onChange={(e) => updateForm("type", e.target.value)} /></label>
                <label>Région<input value={form.region} onChange={(e) => updateForm("region", e.target.value)} /></label>
                <label>Matière<input value={form.material} onChange={(e) => updateForm("material", e.target.value)} /></label>
                <label>Technique<input value={form.technique} onChange={(e) => updateForm("technique", e.target.value)} /></label>
                <label>Couleurs<input value={form.colors} onChange={(e) => updateForm("colors", e.target.value)} /></label>
                <label>Longueur cm<input type="number" value={form.lengthCm} onChange={(e) => updateForm("lengthCm", e.target.value)} /></label>
                <label>Largeur cm<input type="number" value={form.widthCm} onChange={(e) => updateForm("widthCm", e.target.value)} /></label>
                <label>Poids kg<input type="number" value={form.weightKg} onChange={(e) => updateForm("weightKg", e.target.value)} /></label>
                <label>Âge années<input type="number" value={form.ageYears} onChange={(e) => updateForm("ageYears", e.target.value)} /></label>
                <label>Prix €<input type="number" value={form.price} onChange={(e) => updateForm("price", e.target.value)} /></label>
                <label>Stock<input type="number" value={form.stock} onChange={(e) => updateForm("stock", e.target.value)} /></label>
                <label>Statut
                  <select value={form.status} onChange={(e) => updateForm("status", e.target.value as ProductStatus)}>
                    <option value="Available">Disponible</option>
                    <option value="Reserved">Réservé</option>
                    <option value="Sold">Vendu</option>
                    <option value="Hidden">Masqué</option>
                  </select>
                </label>
                <label>Style<input value={form.style} onChange={(e) => updateForm("style", e.target.value)} /></label>
              </div>

              <label className="product-full-label">Description
                <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
              </label>

              <label className="product-full-label">Histoire courte
                <textarea value={form.shortStory} onChange={(e) => updateForm("shortStory", e.target.value)} />
              </label>

              <label className="product-full-label">Conseils d’entretien
                <textarea value={form.careInstructions} onChange={(e) => updateForm("careInstructions", e.target.value)} />
              </label>

              <div className="product-switches">
                {[
                  ["isActive", "Produit actif"],
                  ["isFeatured", "Produit vedette"],
                  ["isHandmade", "Fait main"],
                  ["isUniquePiece", "Pièce unique"],
                  ["isPriceOnRequestOnlyInTunisia", "Prix sur demande en Tunisie"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={form[key as keyof ProductForm] ? "checked" : ""}
                    onClick={() => updateForm(key as keyof ProductForm, !form[key as keyof ProductForm])}
                  >
                    <Check size={15} />
                    {label}
                  </button>
                ))}
              </div>

              {editingProduct && editingProduct.images.length > 0 && (
                <div className="existing-images">
                  <h3>Images existantes</h3>
                  <div className="existing-images-grid">
                    {editingProduct.images.map((img) => (
                      <div className="existing-image" key={img.id}>
                        <img src={getImageUrl(img.imageUrl)} alt="" />
                        {img.isMain && <span>Principale</span>}
                        <div>
                          <button type="button" onClick={() => setMainImage(img.id)} disabled={saving || uploadingImages}>
                            {saving || uploadingImages ? <Loader2 className="spin" size={14} /> : <Camera size={14} />}
                          </button>
                          <button type="button" onClick={() => deleteImage(img.id)} disabled={saving || uploadingImages}>
                            {saving || uploadingImages ? <Loader2 className="spin" size={14} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="upload-zone">
                <UploadCloud size={30} />
                <strong>Ajouter des photos</strong>
                <span>JPG, PNG, WEBP — max 5MB/image</span>
                <input type="file" multiple accept="image/*" onChange={handleFiles} />
              </label>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <ImagePlus size={17} />
                  {selectedFiles.length} image(s) sélectionnée(s)
                </div>
              )}
            </div>

            <div className="product-modal-footer">
              <button type="button" onClick={closeModal}>Annuler</button>
              <button type="submit" disabled={saving}>
                {saving && <Loader2 className="spin" size={17} />}
                {uploadingImages && !saving && <Loader2 className="spin" size={17} />}
                {editingProduct ? "Enregistrer" : "Créer le produit"}
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal && (
          <motion.div
            className="product-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!confirmLoading) setConfirmModal(null);
            }}
          >
            <motion.div
              className="product-confirm-modal"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3>{confirmModal.title}</h3>
              <p>{confirmModal.description}</p>
              <div className="product-confirm-actions">
                <button type="button" onClick={() => setConfirmModal(null)} disabled={confirmLoading}>
                  Annuler
                </button>
                <button
                  type="button"
                  className={confirmModal.tone === "danger" ? "danger" : ""}
                  onClick={onConfirmModalAction}
                  disabled={confirmLoading}
                >
                  {confirmLoading
                    ? confirmModal.loadingLabel ?? "Traitement..."
                    : confirmModal.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorModal && (
          <motion.div
            className="product-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setErrorModal(null)}
          >
            <motion.div
              className="product-error-modal"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="product-error-modal-head">
                <AlertCircle size={20} />
                <h3>Erreur API</h3>
              </div>
              <p>{errorModal.message}</p>
              {typeof errorModal.status === "number" && (
                <small>HTTP {errorModal.status}</small>
              )}
              {errorModal.details && (
                <pre>{errorModal.details}</pre>
              )}
              <button type="button" onClick={() => setErrorModal(null)}>
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="detail-info-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function getToastIcon(kind: ToastKind) {
  if (kind === "success") return <CheckCircle2 size={18} />;
  if (kind === "error") return <AlertCircle size={18} />;
  if (kind === "warning") return <AlertTriangle size={18} />;
  return <InfoIcon size={18} />;
}
