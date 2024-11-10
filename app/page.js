"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import SearchBar from "../Components/SearchBar";
import FolderList from "../Components/folder/FolderList";
import FileList from "../Components/file/FileList";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { app } from "@/Config/FirebaseConfig";
import { ParentFolderIdContext } from "@/Context/ParentFolderIdContext";
import { FolderRefreshContext } from "@/Context/FolderRefreshContext";

export default function Home() {
  const { data: session, status } = useSession();
  const [folderLoading, setFolderLoading] = useState(true);
  const [folderList, setFolderList] = useState([]);
  const { parentFolderId, setParentFolderId } = useContext(ParentFolderIdContext);
  const { folderRefresh, setFolderRefresh } = useContext(FolderRefreshContext);
  const db = getFirestore(app);

  useEffect(() => {
    // Redirect to login if no session and session status is 'unauthenticated'
    if (status === "unauthenticated") {
      redirect("/login");
    }

    // Fetch folders only once when session is available
    if (status === "authenticated" && folderList.length === 0) {
      setFolderList([]);
      getFolderList();
    }

    // Refetch folders when folderRefresh changes
    if (status === "authenticated" && folderRefresh) {
      setFolderList([]);
      getFolderList();
      setFolderRefresh(false);
    }

    setParentFolderId(0);
  }, [session, status, folderRefresh]);

  const getFolderList = async () => {
    setFolderLoading(true);
    try {
      const q = query(
        collection(db, "folders"),
        where("createdBy", "==", session.user.email),
        where("parentFolderId", "==", 0)
      );
      const querySnapshot = await getDocs(q);
      const folders = querySnapshot.docs.map((doc) => doc.data());
      setFolderList(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setFolderLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-100 p-5">
      <SearchBar />
      <FolderList folderList={folderList} loading={folderLoading} />
      <FileList />
    </div>
  );
}