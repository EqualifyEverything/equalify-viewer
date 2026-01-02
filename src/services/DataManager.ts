
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
  auditTable?: any[]; // Allow for different data structures
  scan_date?: string;
  // availableCategories, statusCounts, etc. can be added if needed
}

export interface Dataset {
  id: string;
  url: string;
  name: string;
  blockers: Blocker[];
  timestamp: number;
  color?: string;
  index?: number;
}

export const loadDataset = async (url: string): Promise<Dataset> => {
  try {
    // Basic URL validation
    let fetchUrl = url;
    try {
      new URL(url); // Just validate it's a valid URL
    } catch (e) {
      console.error("Invalid URL provided:", url);
      throw new Error("The provided URL is not valid.");
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText} (${response.status})`);
    }
    let data: ApiResponse = await response.json();

    // Map blockers, falling back to various potential keys if blockers is missing or empty
    // This addresses the requirement to "load all resources from the json"
    let blockers: Blocker[] = data.blockers || [];

    // Helper to extract data from a potential array field
    const extractFromList = (list: any[]) => {
      return list.map((item: any, index: number) => ({
        id: item.id || `res_${index}_${Date.now()}`,
        url: item.URL || item.url || '',
        messages: Array.isArray(item.messages) ? item.messages : [item.messages || item.Type || 'Resource'],
        created_at: data.scan_date || item.created_at || new Date().toISOString(),
        content: item.content || (item.Type ? `Type: ${item.Type}` : ''),
        categories: item.categories || [],
        tags: item.tags || []
      }));
    };

    // Robust fallback: Check several known field names for data items
    if (blockers.length === 0) {
      const fallbackKeys = ['auditTable', 'audit_table', 'results', 'data', 'items', 'records'];
      for (const key of fallbackKeys) {
        const potentialList = (data as any)[key];
        if (Array.isArray(potentialList) && potentialList.length > 0) {
          console.log(`Mapping ${potentialList.length} items from '${key}' since blockers is empty.`);
          blockers = extractFromList(potentialList);
          break;
        }
      }
    }

    // Handle the "pageSize bug" and "not pay attention to page size" requirement
    // If we're hitting an API and have more pages to fetch, do it automatically.
    // We detect an API by checking for common query params or the presence of pagination metadata with multiple pages.
    const urlObj = new URL(url);
    const isPublicApi = urlObj.hostname.includes('equalifyapp.com') && urlObj.pathname.includes('/public/');

    if (isPublicApi && data.pagination && data.pagination.totalPages > 1 && data.pagination.page === 1) {
      console.log(`Detected multi-page API response (${data.pagination.totalPages} pages). Fetching all pages...`);
      for (let p = 2; p <= data.pagination.totalPages; p++) {
        const pageUrl = new URL(url);
        pageUrl.searchParams.set('page', p.toString());
        try {
          const pResponse = await fetch(pageUrl.toString());
          if (pResponse.ok) {
            const pData = await pResponse.json();
            const pBlockers = pData.blockers || [];
            if (pBlockers.length > 0) {
              blockers = [...blockers, ...pBlockers];
            } else {
              // Try fallback keys for this page too
              const fallbackKeys = ['auditTable', 'audit_table', 'results', 'data', 'items', 'records'];
              for (const key of fallbackKeys) {
                const potentialList = pData[key];
                if (Array.isArray(potentialList) && potentialList.length > 0) {
                  blockers = [...blockers, ...extractFromList(potentialList)];
                  break;
                }
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch page ${p}:`, err);
        }
      }
    }

    // Extra case: If blockers is STILL empty but totalCount is > 0 and it's an API, 
    // the pageSize might be too high for the server to handle (the "pageSize bug").
    // Try a recursive fetch with a smaller pageSize if we haven't already.
    if (blockers.length === 0 && data.pagination && data.pagination.totalCount > 0 && isPublicApi && urlObj.searchParams.get('pageSize') !== '100') {
      console.warn("Blockers empty despite positive totalCount. Attempting retry with pageSize=100...");
      const retryUrl = new URL(url);
      retryUrl.searchParams.set('pageSize', '100');
      retryUrl.searchParams.set('page', '1');
      const retryDataset = await loadDataset(retryUrl.toString());
      return retryDataset;
    }

    // Generate a unique ID for local tracking to allow multiple views/pages of the same audit
    const localId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Extract date from URL or filename if present
    const datePattern = /(\d{4}-\d{2}-\d{2})/;
    const dateMatch = url.match(datePattern);
    const extractedDate = dateMatch ? dateMatch[1] : null;

    let datasetName = data.audit_name || "";

    // Clean up the audit_name if it looks like a filename (slugs with dashes/underscores)
    // or if it's generic, or if it's missing altogether.
    const isSlug = datasetName.includes('_') || datasetName.includes('-') && !datasetName.includes(' ');

    if (!datasetName || datasetName === "Untitled Audit" || isSlug) {
      let baseForName = datasetName || "";

      // If we don't have a good name yet, grab it from the URL
      if (!baseForName || isSlug) {
        try {
          const pathParts = new URL(url).pathname.split('/');
          baseForName = pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, "");
        } catch (e) { }
      }

      if (baseForName) {
        // Strip the date from the base string if it's there
        if (extractedDate) {
          baseForName = baseForName.replace(extractedDate, "");
        }

        // Humanize: replace underscores/dashes with spaces, filter out extra separators, and title case
        datasetName = baseForName
          .split(/[-_]/)
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }

    if (!datasetName) datasetName = "Untitled Audit";

    // Append date if found and not already in name
    if (extractedDate && !datasetName.includes(extractedDate)) {
      datasetName = `${datasetName} (${extractedDate})`;
    }

    return {
      id: localId,
      url: url,
      name: datasetName,
      blockers: blockers,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error loading dataset:", error);
    throw error;
  }
};

