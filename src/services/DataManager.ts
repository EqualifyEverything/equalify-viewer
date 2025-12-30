
export interface Tag {
  id: string;
  content: string;
}

export interface Blocker {
  id: string;
  created_at: string;
  messages: string[];
  url: string;
  content: string;
  categories: string[];
  tags: Tag[];
  // 'status' is not directly on the blocker object in the sample but might be useful if present later
}

// Keeping DatasetConfig for backward compatibility or potential future list usage

// Keeping DatasetConfig for backward compatibility or potential future list usage
// export interface DatasetConfig {
//   name: string;
//   url: string;
// }

// export const fetchDatasetList = async (): Promise<DatasetConfig[]> => {
//   // Current requirement is to let user enter URL. 
//   // We'll return an empty list or predefined ones if needed later.
//   return [];
// };

export const STORAGE_KEY = 'equalify_ignored_ids';

export const getIgnoredIds = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const toggleIgnoreId = (id: string) => {
  const current = getIgnoredIds();
  const index = current.indexOf(id);
  let newIds;
  if (index >= 0) {
    newIds = current.filter(i => i !== id);
  } else {
    newIds = [...current, id];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
  return newIds;
};

export const bulkIgnoreIds = (ids: string[], shouldIgnore: boolean) => {
  const current = new Set(getIgnoredIds());
  ids.forEach(id => {
    if (shouldIgnore) current.add(id);
    else current.delete(id);
  });
  const newIds = Array.from(current);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
  return newIds;
};

interface Pagination {
  totalPages: number;
  pageSize: number;
  page: number;
  totalCount: number;
}

interface ApiResponse {
  audit_name: string;
  audit_id: string;
  pagination: Pagination;
  blockers: Blocker[];
  // availableCategories, statusCounts, etc. can be added if needed
}

export interface Dataset {
  id: string;
  url: string;
  name: string;
  blockers: Blocker[];
  timestamp: number;
}

export const loadDataset = async (url: string): Promise<Dataset> => {
  try {
    // Basic URL validation
    let fetchUrl = url;
    try {
      const parsedUrl = new URL(url);
      const pageSize = parsedUrl.searchParams.get('pageSize');
      if (!pageSize || parseInt(pageSize) < 100) {
        // Enforce larger page size if not set or too small, though the user's URL usually rules
        // For now, trust the user's URL but warn if needed
      }
      if (pageSize && parseInt(pageSize) > 100) {
        console.warn(`Large pageSize (${pageSize}) detected. The API may return empty results. Consider reducing it to 100.`);
      }
    } catch (e) {
      console.error("Invalid URL provided:", url);
      throw new Error("The provided URL is not valid.");
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText} (${response.status})`);
    }
    const data: ApiResponse = await response.json();

    // If blockers is empty but totalCount is > 0, it's likely the pageSize bug
    if ((!data.blockers || data.blockers.length === 0) && data.pagination && data.pagination.totalCount > 0) {
      console.warn("API returned 0 blockers despite a positive totalCount. This often happens with pageSize > 100.");
      throw new Error("The API returned no data for this page size. Please try reducing the pageSize in the URL (e.g., to 100).");
    }

    // Generate a unique ID for local tracking to allow multiple views/pages of the same audit
    const localId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      id: localId,
      url: url,
      name: data.audit_name || "Untitled Audit",
      blockers: data.blockers || [],
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error loading dataset:", error);
    throw error;
  }
};

