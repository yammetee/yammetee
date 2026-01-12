'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  avatar?: string;
  likes: number;
}

export default function Wall() {
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    try {
      const response = await fetch('/api/comments');
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        console.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`/api/comments/${id}/like`, {
        method: 'PATCH',
      });
      if (response.ok) {
        const updatedComment = await response.json();
        setComments(comments.map(c => c.id === id ? updatedComment : c));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setMessage(t.wall.fillFields);
      return;
    }
    if (!isAnonymous && !author.trim()) {
      setMessage(t.wall.fillFields);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: isAnonymous ? '' : author.trim(),
          content: content.trim(),
          isAnonymous,
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setAuthor('');
        setContent('');
        setIsModalOpen(false);
        setMessage(t.wall.success);
      } else if (response.status === 409) {
        setMessage(t.wall.duplicate);
      } else {
        setMessage(t.wall.error);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setMessage(t.wall.error);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-lg mt-2">{t.wall.description}</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
                  >
                    {t.wall.submit}
                  </button>
                </div>

      {message && <p className="mb-4 text-green-400">{message}</p>}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-neutral-800 p-6 rounded-md">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {comment.avatar ? (
                  <Image
                    src={comment.avatar}
                    alt={comment.author}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">?</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">
                    {comment.isAnonymous ? t.wall.anonymous : comment.author}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-300">{comment.content}</p>
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-red-400 cursor-pointer"
                  >
                    <span>❤️</span>
                    <span>{comment.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t.wall.submit}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="radio"
                    name="type"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="mr-2"
                  />
                  {t.wall.public}
                </label>
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="radio"
                    name="type"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="mr-2"
                  />
                  {t.wall.anonymous}
                </label>
              </div>
              {!isAnonymous && (
                <div className="mb-4">
                  <label htmlFor="author" className="block text-sm font-medium mb-2">{t.wall.name}</label>
                  <input
                    type="text"
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!isAnonymous}
                  />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium mb-2">{t.wall.comment}</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {t.wall.note}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
                >
                  {t.wall.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium"
                >
                  {loading ? t.wall.submitting : t.wall.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}