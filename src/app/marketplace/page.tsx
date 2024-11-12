// src/app/discover/closet/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import { getNFTDetail, getNFTList } from "@/utils/nftMarket";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Input } from "@/components/ui/input";

export interface NFTDetail {
  name: string;
  symbol: string;
  image?: string;
  group?: string;
  mint: string;
  seller: string;
  price: string;
  listing: string;
  collection?: string;
  description?: string;
  designer?: string;
  website?: string;
  year?: string;

  [key: string]: any;
}

export interface NFTFilterCriteria {
  collection?: string;
  description?: string;
  designer?: string;
  name?: string;
  website?: string;
  year?: string;
  minPrice?: number;
  maxPrice?: number;

  [key: string]: any;
}

const trimAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

const Closet: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [assets, setAssets] = useState<NFTDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<NFTFilterCriteria>({});
  const [isFilterDirty, setIsFilterDirty] = useState<boolean>(false);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  useEffect(() => {
    const storedWalletAddress = sessionStorage.getItem("walletAddress");
    const storedAssets = sessionStorage.getItem("assets");

    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
    }

    if (storedAssets) {
      setAssets(JSON.parse(storedAssets));
    }
    fetchNFTs();
  }, []);

  useEffect(() => {
    fetchNFTs();
  }, [wallet]);

  useEffect(() => {
    sessionStorage.setItem("walletAddress", walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    sessionStorage.setItem("assets", JSON.stringify(assets));
  }, [assets]);

  const fetchNFTs = async () => {
    setIsLoading(true);
    const provider = new AnchorProvider(connection, wallet as Wallet, {});

    try {
      const listings = await getNFTList(provider, connection);
      const promises = listings
        .filter((list) => list.isActive)
        .map((list) => {
          const mint = new PublicKey(list.mint);
          return getNFTDetail(
            mint,
            connection,
            list.seller,
            list.price,
            list.pubkey
          );
        });
      const detailedListings = await Promise.all(promises);
      console.log(detailedListings);

      setAssets(detailedListings);
    } catch (errr) {
      console.log(errr);
    } finally {
      setIsLoading(false);
    }
  };

  const changeFilterCriteria = (key: string, value: string) => {
    if (key == "minPrice" && Number(value) > (filterCriteria.maxPrice ?? 0))
      return;

    if (key == "maxPrice" && Number(value) < (filterCriteria.minPrice ?? 0))
      return;

    setFilterCriteria((prev) => {
      return { ...prev, [key]: value } as NFTFilterCriteria;
    });

    if (!isFilterDirty) {
      setIsFilterDirty(true);
    }
  };

  const onFilterAssets = () => {
    const filtersArr = Object.keys(filterCriteria) as string[];

    console.log(filterCriteria);

    const filteredAssets = assets.filter((asset) =>
      filtersArr.every((key) => {
        const assetKey: string = asset[key] ?? "";
        const filterKey: string = filterCriteria[key] ?? "";

        return key !== "minPrice" && key !== "maxPrice"
          ? assetKey.toLowerCase().includes(filterKey.toLowerCase())
          : key == "minPrice"
          ? Number(asset.price) >= Number(filterKey) * LAMPORTS_PER_SOL
          : key == "maxPrice"
          ? Number(asset.price) <= Number(filterKey) * LAMPORTS_PER_SOL
          : false;
      })
    );

    setAssets(filteredAssets);
  };

  const onClearFilters = () => {
    setFilterCriteria({});
    setIsFilterDirty(false);
    fetchNFTs();
  };

  return (
    <div className="p-4 pt-20 bg-white dark:bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center text-black dark:text-white">
        NFTs on sale
      </h1>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      <div className="flex items-start justify-evenly">
        <div>
          <label
            htmlFor="collection"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Collection
          </label>
          <Input
            id="collection"
            value={filterCriteria.collection ?? ""}
            onChange={(e) => changeFilterCriteria(e.target.id, e.target.value)}
            placeholder="Input collection..."
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <Input
            id="description"
            value={filterCriteria.description ?? ""}
            onChange={(e) => changeFilterCriteria(e.target.id, e.target.value)}
            placeholder="Input description..."
          />
        </div>
        <div>
          <label
            htmlFor="Designer"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Designer
          </label>
          <Input
            id="designer"
            value={filterCriteria.designer ?? ""}
            onChange={(e) => changeFilterCriteria(e.target.id, e.target.value)}
            placeholder="Input designer..."
          />
        </div>
      </div>

      <div className="mt-4 mb-4 flex items-start justify-evenly">
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Website
          </label>
          <Input
            id="website"
            value={filterCriteria.website ?? ""}
            onChange={(e) => changeFilterCriteria(e.target.id, e.target.value)}
            placeholder="Input website..."
          />
        </div>
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Year
          </label>
          <Input
            id="year"
            value={filterCriteria.year ?? ""}
            onChange={(e) => changeFilterCriteria(e.target.id, e.target.value)}
            placeholder="Input year..."
          />
        </div>
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Min. Price
          </label>
          <Input
            id="minPrice"
            value={filterCriteria.minPrice ?? ""}
            type="number"
            min={0}
            max={filterCriteria.maxPrice}
            onChange={(e) => changeFilterCriteria(e.target.id, e.target.value)}
            placeholder="Input min. price..."
          />
        </div>
        <div>
          <label
            htmlFor="minPrice"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Max. Price
          </label>
          <Input
            id="maxPrice"
            value={filterCriteria.maxPrice ?? ""}
            type="number"
            min={filterCriteria.minPrice ?? 0}
            onChange={(e) => changeFilterCriteria(e.target.id, e.target.value)}
            placeholder="Input max. price..."
          />
        </div>
      </div>

      <div className="mt-4 mb-4 flex-row items-center text-end">
        {isFilterDirty ? (
          <button
            className="bg-red-900 text-white hover:bg-red-800 rounded-xl p-2 mr-2"
            onClick={() => onClearFilters()}
          >
            Clear Filters
          </button>
        ) : null}
        <button
          className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl p-2"
          onClick={() => onFilterAssets()}
        >
          Apply Filters
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset: NFTDetail) => (
            <div
              key={asset.mint}
              className="relative p-4 border rounded shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer bg-white dark:bg-black group"
            >
              <Link href={`/marketplace/${asset.mint}`}>
                <div className="relative h-64 w-full mb-4">
                  {asset.image ? (
                    <Image
                      src={asset.image}
                      alt={`Asset ${asset.mint}`}
                      layout="fill"
                      objectFit="contain"
                      className="rounded"
                    />
                  ) : (
                    <p>No Image Available</p>
                  )}
                </div>
              </Link>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity flex flex-col justify-end items-center opacity-0 group-hover:opacity-100 text-white text-xs p-2">
                {asset.name ? (
                  <p className="font-semibold">Name: {asset.name}</p>
                ) : null}
                {asset.collection ? (
                  <p className="font-semibold">
                    Collection: {asset.collection}
                  </p>
                ) : null}
                {asset.designer ? (
                  <p className="font-semibold">Designer: {asset.designer}</p>
                ) : null}
                {asset.year ? (
                  <p className="font-semibold">Year: {asset.year}</p>
                ) : null}
                <Link
                  href={`https://solana.fm/address/${asset.mint}`}
                  target="_blank"
                  className="hover:text-gray-300 flex items-center"
                >
                  {trimAddress(asset.mint)}{" "}
                  <FaExternalLinkAlt className="ml-1" />
                </Link>
                {asset.group && (
                  <Link
                    href={`https://solana.fm/address/${asset.group}`}
                    target="_blank"
                    className="hover:text-gray-300 flex items-center"
                  >
                    Group: {trimAddress(asset.group)}{" "}
                    <FaExternalLinkAlt className="ml-1" />
                  </Link>
                )}
                {asset.price ? (
                  <p className="font-semibold">
                    Price: {asset.price / LAMPORTS_PER_SOL} SOL
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h2 className="text-2xl font-bold mb-4 text-center text-red-500 dark:text-yellow">
          No NFTs on sale
        </h2>
      )}
    </div>
  );
};

export default Closet;
