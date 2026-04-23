'use client';

import { useRouter } from 'next/navigation';

import { CreateBasicInfoSection } from './create-basic-info-section';
import { CreateOverlays } from './create-overlays';
import { CreateOptionsSection } from './create-options-section';
import { CreatePkSection } from './create-pk-section';
import { CreateSettingsSection } from './create-settings-section';
import { templates } from './create-helpers';
import { useCreatePageState } from './use-create-page-state';
import styles from './page.module.css';

/**
 * 创建竞猜页暂时仍是老系统形态对齐页。
 * 这里优先还原旧页面结构和节奏，不在这一轮扩展真实发布链路。
 */
export default function CreatePage() {
  const router = useRouter();
  const {
    titleInputRef,
    coverInputRef,
    isMerchantMode,
    template,
    setTemplate,
    title,
    setTitle,
    desc,
    setDesc,
    deadline,
    setDeadline,
    options,
    selectedFriends,
    setShareOpen,
    friendKeyword,
    setFriendKeyword,
    selectedProduct,
    productPickerOpen,
    setPreviewOpen,
    productKeyword,
    setProductKeyword,
    tempProductId,
    setTempProductId,
    productCategory,
    setProductCategory,
    productSort,
    setProductSort,
    sortDropdownOpen,
    setSortDropdownOpen,
    couponEnabled,
    setCouponEnabled,
    couponType,
    setCouponType,
    couponThreshold,
    setCouponThreshold,
    couponAmount,
    setCouponAmount,
    couponDiscount,
    setCouponDiscount,
    couponMaxOff,
    setCouponMaxOff,
    previewOpen,
    shareOpen,
    publishing,
    publishStep,
    successOpen,
    setSuccessOpen,
    toast,
    titleTipVisible,
    titleInputError,
    selectedTopic,
    coverPreviewUrl,
    coverUploading,
    coverUploaded,
    qrPanelOpen,
    setQrPanelOpen,
    inviteLink,
    shareClickCount,
    linkCopied,
    steps,
    progress,
    selectedCount,
    previewCoupon,
    filteredFriends,
    selectedFriendList,
    filteredProducts,
    productItems,
    tempProduct,
    productCategories,
    sortLabel,
    visibleTopics,
    updateOption,
    addOption,
    removeOption,
    toggleFriend,
    showToast,
    confirmProductPick,
    refreshTopics,
    pickTopic,
    openShareInvite,
    regenerateInviteLink,
    copyInviteLink,
    shareVia,
    openProductPicker,
    closeProductPicker,
    handleCoverPick,
    handlePublish,
  } = useCreatePageState();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>创建竞猜</div>
        <div className={styles.headerAction} />
      </header>

      <div className={`${styles.roleBar} ${isMerchantMode ? styles.merchantMode : styles.userMode}`}>
        <span className={styles.roleIcon}>{isMerchantMode ? '🏪' : '👤'}</span>
        <span className={styles.roleText}>{isMerchantMode ? '商家模式' : '用户模式'}</span>
        <span className={`${styles.roleBadge} ${!isMerchantMode ? styles.roleBadgeHidden : ''}`}>PRO</span>
        <span className={styles.roleDesc}>{isMerchantMode ? '全功能创建模式' : '仅限好友PK竞猜'}</span>
      </div>

      <div className={styles.formProgress}>
        <div className={styles.progressBar}>
          {steps.map((step, index) => (
            <div key={index} className={`${styles.progressSeg} ${step ? styles.progressSegDone : ''}`} />
          ))}
        </div>
        <div className={styles.progressInfo}>
          <span>创建进度</span>
          <span className={styles.progressPct}>{progress}%</span>
        </div>
      </div>

      <div className={styles.sectionHeader}>选择竞猜模板</div>
      <div className={styles.templateGrid}>
        {templates.map((item) => {
          const locked = item.merchantOnly && !isMerchantMode;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.templateCard} ${template === item.id ? styles.templateSelected : ''} ${locked ? styles.templateLocked : ''}`}
              onClick={() => {
                if (!locked) {
            setTemplate(item.id);
            showToast(`${item.name} 模板`);
                }
              }}
            >
              <div className={styles.templateIcon}>{item.icon}</div>
              <div className={styles.templateName}>{item.name}</div>
              <div className={styles.templateDesc}>{item.desc}</div>
              {locked ? <div className={styles.templateMask}>🔒 开店解锁</div> : null}
            </button>
          );
        })}
      </div>

      {!isMerchantMode ? (
        <button className={styles.merchantHook} type="button" onClick={() => router.push('/my-shop')}>
          <div className={styles.merchantHookIcon}>🏪</div>
          <div className={styles.merchantHookInfo}>
            <div className={styles.merchantHookTitle}>想要发布更多竞猜玩法？</div>
            <div className={styles.merchantHookDesc}>开通商家身份，解锁二选一、多选、数值预测等全模板 + 关联商品 + 自动优惠券</div>
          </div>
          <i className={`fa-solid fa-chevron-right ${styles.merchantHookArrow}`} />
        </button>
      ) : null}

      <div className={styles.dividerThick} />

      <CreateBasicInfoSection
        stepDone={steps[1]}
        titleInputRef={titleInputRef}
        title={title}
        setTitle={setTitle}
        visibleTopics={visibleTopics}
        selectedTopic={selectedTopic}
        pickTopic={pickTopic}
        refreshTopics={refreshTopics}
        titleTipVisible={titleTipVisible}
        titleInputError={titleInputError}
        desc={desc}
        setDesc={setDesc}
        coverInputRef={coverInputRef}
        coverPreviewUrl={coverPreviewUrl}
        coverUploading={coverUploading}
        coverUploaded={coverUploaded}
        handleCoverPick={handleCoverPick}
      />

      <div className={styles.dividerThick} />

      <CreateOptionsSection
        stepDone={steps[2]}
        selectedCount={selectedCount}
        options={options}
        updateOption={updateOption}
        removeOption={removeOption}
        addOption={addOption}
      />

      {template === 'pk' ? (
        <>
          <div className={styles.dividerThick} />
          <CreatePkSection
            selectedFriends={selectedFriends}
            friendKeyword={friendKeyword}
            setFriendKeyword={setFriendKeyword}
            filteredFriends={filteredFriends}
            selectedFriendList={selectedFriendList}
            toggleFriend={toggleFriend}
            showToast={showToast}
            openShareInvite={openShareInvite}
          />
        </>
      ) : null}

      <div className={styles.dividerThick} />

      <CreateSettingsSection
        stepDone={steps[3]}
        deadline={deadline}
        setDeadline={setDeadline}
        isMerchantMode={isMerchantMode}
        openProductPicker={openProductPicker}
        selectedProduct={selectedProduct}
        couponEnabled={couponEnabled}
        setCouponEnabled={setCouponEnabled}
        couponType={couponType}
        setCouponType={setCouponType}
        couponThreshold={couponThreshold}
        setCouponThreshold={setCouponThreshold}
        couponAmount={couponAmount}
        setCouponAmount={setCouponAmount}
        couponDiscount={couponDiscount}
        setCouponDiscount={setCouponDiscount}
        couponMaxOff={couponMaxOff}
        setCouponMaxOff={setCouponMaxOff}
        previewCoupon={previewCoupon}
      />

      <div className={styles.bottomBar}>
        <button className={styles.previewBtn} type="button" onClick={() => setPreviewOpen(true)}>
          预览
        </button>
        <button className={styles.publishBtn} type="button" onClick={handlePublish}>
          发布竞猜
        </button>
      </div>

      <CreateOverlays
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
        template={template}
        title={title}
        desc={desc}
        deadline={deadline}
        selectedProduct={selectedProduct}
        options={options}
        couponEnabled={couponEnabled}
        couponType={couponType}
        couponDiscount={couponDiscount}
        couponAmount={couponAmount}
        previewCoupon={previewCoupon}
        handlePublish={handlePublish}
        productPickerOpen={productPickerOpen}
        closeProductPicker={closeProductPicker}
        productKeyword={productKeyword}
        setProductKeyword={setProductKeyword}
        productCategories={productCategories}
        productCategory={productCategory}
        setProductCategory={setProductCategory}
        sortDropdownOpen={sortDropdownOpen}
        setSortDropdownOpen={setSortDropdownOpen}
        sortLabel={sortLabel}
        productSort={productSort}
        setProductSort={setProductSort}
        filteredProducts={filteredProducts}
        productTotalCount={productItems.length}
        tempProduct={tempProduct}
        tempProductId={tempProductId}
        setTempProductId={setTempProductId}
        confirmProductPick={confirmProductPick}
        shareOpen={shareOpen}
        setShareOpen={setShareOpen}
        selectedFriendList={selectedFriendList}
        showToast={showToast}
        qrPanelOpen={qrPanelOpen}
        setQrPanelOpen={setQrPanelOpen}
        inviteLink={inviteLink}
        shareClickCount={shareClickCount}
        linkCopied={linkCopied}
        regenerateInviteLink={regenerateInviteLink}
        copyInviteLink={copyInviteLink}
        shareVia={shareVia}
        publishing={publishing}
        publishStep={publishStep}
        successOpen={successOpen}
        setSuccessOpen={setSuccessOpen}
        routerPushHome={() => router.push('/')}
      />

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
